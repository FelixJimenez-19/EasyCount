import { Denomination, Transaction, TransactionBreakdown, TransactionRow } from "@/app/types/models";
import { api } from "./api-client";
import { SyncEngine } from "./sync-engine";
import { newId } from "@/src/utils/id";
import { DenominationsRepo } from "@/src/db/repositories/denominations";
import { TransactionsRepo, type LocalTransactionInput } from "@/src/db/repositories/transactions";
import { OperationsRepo } from "@/src/db/repositories/operations";
import { SyncMetaRepo } from "@/src/db/repositories/sync-meta";

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

export const CountService = {
    async getDenominaciones(): Promise<Denomination[]> {
        try {
            const data = await api.get<Denomination[]>("/denominations");
            await DenominationsRepo.replaceAll(data);
            return data;
        } catch (error) {
            console.error("Error fetching denominations (using local cache):", error);
            return DenominationsRepo.getAll();
        }
    },

    async addDenominacion(value: number, type: string, active: boolean): Promise<Denomination | null> {
        try {
            const nuevo = await api.post<Denomination>("/denominations", { value, type, active });
            await DenominationsRepo.replaceAll(await api.get<Denomination[]>("/denominations"));
            return nuevo;
        } catch (error) {
            console.error("Error to add Denomination:", error);
            return null;
        }
    },

    async toggleDenominacion(id: number, active: boolean): Promise<boolean> {
        await DenominationsRepo.toggleLocal(id, active);
        await OperationsRepo.enqueue("toggle_denomination", newId(), {
            id_denomination: id,
            active,
            updatedAt: new Date().toISOString(),
        });
        SyncEngine.kick();
        return true;
    },

    async saveTransaction(total: number, observacion: string, desgloses: TransactionBreakdown[]): Promise<boolean> {
        try {
            const clientId = newId();
            const now = new Date().toISOString();

            await TransactionsRepo.insertLocal({
                clientId,
                date: now,
                total,
                observation: observacion || "Sin observación",
                breakdown: desgloses,
            });

            await OperationsRepo.enqueue("create_transaction", clientId, {
                clientId,
                total,
                observation: observacion || "Sin observación",
                breakdown: desgloses.map(({ id_denomination, quantity, subtotal }) => ({ id_denomination, quantity, subtotal })),
                createdAt: now,
            });

            SyncEngine.kick();
            return true;
        } catch (error) {
            console.error("Error saving transaction locally:", error);
            return false;
        }
    },

    async getTransactions(): Promise<Transaction[]> {
        try {
            const rows = await api.get<TransactionRow[]>("/transactions");
            await TransactionsRepo.replaceSynced(groupServerRows(rows));
            await SyncMetaRepo.set("last_sync_at", new Date().toISOString());
        } catch (error) {
            console.error("Error fetching transactions (using local data):", error);
        }
        return TransactionsRepo.getAll();
    },

    async getLastSyncAt(): Promise<Date | null> {
        const value = await SyncMetaRepo.get("last_sync_at");
        return value ? new Date(value) : null;
    },
};
