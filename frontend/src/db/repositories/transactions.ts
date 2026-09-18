import { desc, eq } from "drizzle-orm";
import { db, schema } from "../client";
import type { Transaction, TransactionBreakdown } from "@/app/types/models";

export interface LocalTransactionInput {
    clientId: string;
    date: string;
    total: number;
    observation: string;
    evidenceUri?: string | null;
    breakdown: TransactionBreakdown[];
}

export const TransactionsRepo = {
    async insertLocal(input: LocalTransactionInput): Promise<void> {
        const [row] = await db
            .insert(schema.transaction)
            .values({
                clientId: input.clientId,
                date: input.date,
                total: input.total,
                observation: input.observation,
                evidenceUri: input.evidenceUri ?? null,
                synced: false,
                createdAt: input.date,
            })
            .returning({ id: schema.transaction.id });

        if (input.breakdown.length > 0) {
            await db.insert(schema.transactionDenomination).values(
                input.breakdown.map((b) => ({
                    transactionId: row.id,
                    denominationId: b.id_denomination,
                    label: b.label,
                    value: b.value,
                    quantity: b.quantity,
                    subtotal: b.subtotal,
                }))
            );
        }
    },

    async getAll(): Promise<Transaction[]> {
        const txns = await db
            .select()
            .from(schema.transaction)
            .orderBy(desc(schema.transaction.date), desc(schema.transaction.id));

        const breakdowns = await db.select().from(schema.transactionDenomination);

        const byTransaction = new Map<number, Transaction["breakdown"]>();
        for (const b of breakdowns) {
            const list = byTransaction.get(b.transactionId) ?? [];
            list.push({ label: b.label, value: b.value, qty: b.quantity, subtotal: b.subtotal });
            byTransaction.set(b.transactionId, list);
        }

        return txns.map((t) => ({
            id_transaction: String(t.id),
            date: new Date(t.date),
            total: t.total,
            observation: t.observation ?? "",
            evidence: t.evidenceUri ?? null,
            breakdown: byTransaction.get(t.id) ?? [],
        }));
    },

    async getLocal(id: number): Promise<{ clientId: string; synced: boolean } | null> {
        const [row] = await db
            .select({ clientId: schema.transaction.clientId, synced: schema.transaction.synced })
            .from(schema.transaction)
            .where(eq(schema.transaction.id, id))
            .limit(1);
        return row ?? null;
    },

    async deleteLocal(id: number): Promise<void> {
        await db.delete(schema.transactionDenomination).where(eq(schema.transactionDenomination.transactionId, id));
        await db.delete(schema.transaction).where(eq(schema.transaction.id, id));
    },

    async markSyncedByClientId(clientId: string): Promise<void> {
        await db
            .update(schema.transaction)
            .set({ synced: true })
            .where(eq(schema.transaction.clientId, clientId));
    },

    async replaceSynced(list: LocalTransactionInput[]): Promise<void> {
        await db.delete(schema.transaction).where(eq(schema.transaction.synced, true));

        for (const t of list) {
            const [row] = await db
                .insert(schema.transaction)
                .values({
                    clientId: t.clientId,
                    date: t.date,
                    total: t.total,
                    observation: t.observation,
                    evidenceUri: t.evidenceUri ?? null,
                    synced: true,
                    createdAt: t.date,
                })
                .returning({ id: schema.transaction.id });

            if (t.breakdown.length > 0) {
                await db.insert(schema.transactionDenomination).values(
                    t.breakdown.map((b) => ({
                        transactionId: row.id,
                        denominationId: b.id_denomination,
                        label: b.label,
                        value: b.value,
                        quantity: b.quantity,
                        subtotal: b.subtotal,
                    }))
                );
            }
        }
    },

    async clearAll(): Promise<void> {
        await db.delete(schema.transactionDenomination);
        await db.delete(schema.transaction);
    },
};
