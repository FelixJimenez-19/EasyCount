import * as Network from "expo-network";
import { api, isDomainError } from "./http/client";
import { AuthStore } from "./auth-store";
import { OperationsRepo, type PendingOperationRow } from "@/src/db/repositories/operations";
import { TransactionsRepo } from "@/src/db/repositories/transactions";
import { NotificationService } from "./notification-service";

const BASE_MS = 1000;
const MAX_MS = 30000;

const backoff = (attempts: number) => Math.min(BASE_MS * Math.pow(2, attempts - 1), MAX_MS);

let syncing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let networkSubscription: { remove: () => void } | null = null;

type OpResult =
    | "success" // la operación llegó al servidor (o era inválida y se descartó)
    | "offline" // no hay conexión: no se consumen intentos, se espera a la red
    | "retry"; // 5xx, auth o error inesperado: se reintenta con backoff

async function processOp(op: PendingOperationRow): Promise<OpResult> {
    try {
        const payload = JSON.parse(op.payload);

        if (op.type === "create_transaction") {
            await api.post("/transactions", {
                clientId: payload.clientId,
                total: payload.total,
                observation: payload.observation,
                breakdown: payload.breakdown,
                evidence: payload.evidence ?? null,
            });
            await TransactionsRepo.markSyncedByClientId(payload.clientId);
            return "success";
        }

        if (op.type === "delete_transaction") {
            await api.delete(`/transactions/${encodeURIComponent(payload.clientId)}`);
            return "success";
        }

        if (op.type === "toggle_denomination") {
            await api.patch(`/denominations/${payload.id_denomination}`, {
                active: payload.active,
                updatedAt: payload.updatedAt,
            });
            return "success";
        }

        return "success";
    } catch (error) {
        if (isDomainError(error)) {
            // Sin conexión: no es un fallo de la operación, es la red. Se deja
            // pendiente intacta y se reintenta cuando vuelva la conectividad.
            if (error.kind === "network" || error.kind === "timeout") {
                return "offline";
            }
            // Errores 4xx del cliente (excepto auth): la operación es inválida, se descarta.
            if (error.kind === "server" && error.status !== undefined && error.status >= 400 && error.status < 500) {
                return "success";
            }
        }
        // 5xx, auth o error inesperado: se reintenta con backoff.
        return "retry";
    }
}

async function processQueue(): Promise<void> {
    if (syncing || !AuthStore.isLoggedIn()) return;

    // Sin conexión no se intenta: se espera al listener de red para no
    // consumir intentos de las operaciones pendientes.
    try {
        const state = await Network.getNetworkStateAsync();
        if (!state.isConnected) {
            scheduleRetry(MAX_MS);
            return;
        }
    } catch {
        // Si no se puede consultar la red, se intenta igualmente.
    }

    syncing = true;
    try {
        const due = await OperationsRepo.listDue();
        let nextRetryAt: number | null = null;
        let syncedTransactions = 0;

        for (const op of due) {
            const result = await processOp(op);
            if (result === "success") {
                await OperationsRepo.markSuccess(op.clientId);
                if (op.type === "create_transaction") syncedTransactions += 1;
                continue;
            }

            if (result === "offline") {
                // La red cayó a mitad de la cola: se detiene el procesamiento y
                // se reintenta al reconectar, sin gastar intentos.
                const retryAt = Date.now() + MAX_MS;
                if (nextRetryAt === null || retryAt < nextRetryAt) nextRetryAt = retryAt;
                break;
            }

            const attempts = op.attempts + 1;
            if (attempts >= op.maxAttempts) {
                await OperationsRepo.markExhausted(op.clientId);
                continue;
            }

            const delay = backoff(attempts);
            const retryAt = Date.now() + delay;
            await OperationsRepo.markFailure(op.clientId, attempts, new Date(retryAt).toISOString());
            if (nextRetryAt === null || retryAt < nextRetryAt) nextRetryAt = retryAt;
        }

        if (nextRetryAt !== null) {
            scheduleRetry(Math.max(0, nextRetryAt - Date.now()));
        }

        // Feedback nativo: avisar cuando los cierres pendientes llegaron al servidor.
        if (syncedTransactions > 0) {
            void NotificationService.notifySyncComplete(syncedTransactions);
        }
    } finally {
        syncing = false;
    }
}

function scheduleRetry(ms: number): void {
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
        retryTimer = null;
        processQueue();
    }, ms);
}

export const SyncEngine = {
    start(): void {
        if (networkSubscription) return;
        networkSubscription = Network.addNetworkStateListener((state) => {
            if (state.isConnected) {
                processQueue();
            }
        });
        // Recupera operaciones que hayan quedado agotadas por falta de red.
        void OperationsRepo.recoverExhausted().then(() => processQueue());
    },

    stop(): void {
        if (networkSubscription) {
            networkSubscription.remove();
            networkSubscription = null;
        }
        if (retryTimer) {
            clearTimeout(retryTimer);
            retryTimer = null;
        }
    },

    kick(): void {
        processQueue();
    },

    async pendingCount(): Promise<number> {
        return OperationsRepo.countPending();
    },
};
