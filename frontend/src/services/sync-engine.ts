import * as Network from "expo-network";
import { api, isDomainError } from "./http/client";
import { AuthStore } from "./auth-store";
import { OperationsRepo, type PendingOperationRow } from "@/src/db/repositories/operations";
import { TransactionsRepo } from "@/src/db/repositories/transactions";

const BASE_MS = 1000;
const MAX_MS = 30000;

const backoff = (attempts: number) => Math.min(BASE_MS * Math.pow(2, attempts - 1), MAX_MS);

let syncing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let networkSubscription: { remove: () => void } | null = null;

async function processOp(op: PendingOperationRow): Promise<boolean> {
    try {
        const payload = JSON.parse(op.payload);

        if (op.type === "create_transaction") {
            await api.post("/transactions", {
                clientId: payload.clientId,
                total: payload.total,
                observation: payload.observation,
                breakdown: payload.breakdown,
            });
            await TransactionsRepo.markSyncedByClientId(payload.clientId);
            return true;
        }

        if (op.type === "toggle_denomination") {
            await api.patch(`/denominations/${payload.id_denomination}`, {
                active: payload.active,
                updatedAt: payload.updatedAt,
            });
            return true;
        }

        return true;
    } catch (error) {
        if (isDomainError(error)) {
            // Errores 4xx del cliente (excepto auth): la operación es inválida, se descarta.
            if (error.kind === "server" && error.status !== undefined && error.status >= 400 && error.status < 500) {
                return true;
            }
        }
        // Red, timeout, 5xx o auth: se reintenta con backoff.
        return false;
    }
}

async function processQueue(): Promise<void> {
    if (syncing || !AuthStore.isLoggedIn()) return;
    syncing = true;
    try {
        const due = await OperationsRepo.listDue();
        let nextRetryAt: number | null = null;

        for (const op of due) {
            const ok = await processOp(op);
            if (ok) {
                await OperationsRepo.markSuccess(op.clientId);
                continue;
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
        processQueue();
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
