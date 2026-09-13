import type { Transaction, TransactionBreakdown, TransactionRow } from "../../models/transaction";
import { TransactionRemote } from "../remote/transaction-remote";
import { TransactionsRepo, type LocalTransactionInput } from "../../db/repositories/transactions";
import { OperationsRepo } from "../../db/repositories/operations";
import { SyncMetaRepo } from "../../db/repositories/sync-meta";
import { SyncEngine } from "../../services/sync-engine";
import { newId } from "../../utils/id";
import { logger } from "../../utils/logger";

/**
 * Agrupa las filas planas del servidor (una por denominación) en transacciones
 * con su desglose, listas para persistir en la fuente local.
 */
const groupServerRows = (rows: TransactionRow[]): LocalTransactionInput[] => {
    const map = new Map<number, LocalTransactionInput>();

    for (const row of rows) {
        if (!map.has(row.id_transaction)) {
            map.set(row.id_transaction, {
                clientId: row.client_id ?? `server-${row.id_transaction}`,
                date: row.date,
                total: row.total_general,
                observation: row.observation ?? "",
                breakdown: [],
            });
        }
        map.get(row.id_transaction)!.breakdown.push({
            id_denomination: row.id_denomination,
            value: row.value,
            label: `$${Number(row.value).toFixed(2)}`,
            quantity: row.quantity,
            subtotal: row.subtotal,
        });
    }

    return Array.from(map.values());
};

/**
 * Repositorio de transacciones: escritura local-first + encolado para
 * sincronizar, y lectura con fallback a la fuente local.
 */
export const TransactionRepository = {
    async save(total: number, observation: string, breakdown: TransactionBreakdown[]): Promise<boolean> {
        try {
            const clientId = newId();
            const now = new Date().toISOString();
            const safeObservation = observation || "Sin observación";

            await TransactionsRepo.insertLocal({
                clientId,
                date: now,
                total,
                observation: safeObservation,
                breakdown,
            });

            await OperationsRepo.enqueue("create_transaction", clientId, {
                clientId,
                total,
                observation: safeObservation,
                breakdown: breakdown.map(({ id_denomination, quantity, subtotal }) => ({
                    id_denomination,
                    quantity,
                    subtotal,
                })),
                createdAt: now,
            });

            SyncEngine.kick();
            return true;
        } catch (error) {
            logger.error("Error saving transaction locally:", error);
            return false;
        }
    },

    async list(): Promise<Transaction[]> {
        try {
            const rows = await TransactionRemote.getAll();
            await TransactionsRepo.replaceSynced(groupServerRows(rows));
            await SyncMetaRepo.set("last_sync_at", new Date().toISOString());
        } catch (error) {
            logger.warn("Error fetching transactions (using local data):", error);
        }
        return TransactionsRepo.getAll();
    },

    async lastSyncAt(): Promise<Date | null> {
        const value = await SyncMetaRepo.get("last_sync_at");
        return value ? new Date(value) : null;
    },
};
