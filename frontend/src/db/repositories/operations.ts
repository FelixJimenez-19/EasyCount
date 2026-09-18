import { and, eq, gte, isNull, lt, lte, or } from "drizzle-orm";
import { db, schema } from "../client";

export type PendingOperationType = "create_transaction" | "delete_transaction" | "toggle_denomination";

export interface PendingOperationRow {
    id: number;
    clientId: string;
    type: PendingOperationType;
    payload: string;
    attempts: number;
    maxAttempts: number;
}

export const OperationsRepo = {
    async enqueue(type: PendingOperationType, clientId: string, payload: unknown): Promise<void> {
        const now = new Date().toISOString();
        await db.insert(schema.pendingOperation).values({
            clientId,
            type,
            payload: JSON.stringify(payload),
            attempts: 0,
            maxAttempts: 5,
            nextRetryAt: null,
            createdAt: now,
            updatedAt: now,
        });
    },

    async listDue(): Promise<PendingOperationRow[]> {
        const now = new Date().toISOString();
        const rows = await db
            .select({
                id: schema.pendingOperation.id,
                clientId: schema.pendingOperation.clientId,
                type: schema.pendingOperation.type,
                payload: schema.pendingOperation.payload,
                attempts: schema.pendingOperation.attempts,
                maxAttempts: schema.pendingOperation.maxAttempts,
            })
            .from(schema.pendingOperation)
            .where(
                and(
                    lt(schema.pendingOperation.attempts, schema.pendingOperation.maxAttempts),
                    or(isNull(schema.pendingOperation.nextRetryAt), lte(schema.pendingOperation.nextRetryAt, now))
                )
            )
            .orderBy(schema.pendingOperation.id);

        return rows as PendingOperationRow[];
    },

    async countPending(): Promise<number> {
        const rows = await db.select({ id: schema.pendingOperation.id }).from(schema.pendingOperation);
        return rows.length;
    },

    async listPendingToggles(): Promise<{ id_denomination: number; active: boolean }[]> {
        const rows = await db
            .select({ payload: schema.pendingOperation.payload })
            .from(schema.pendingOperation)
            .where(eq(schema.pendingOperation.type, "toggle_denomination"))
            .orderBy(schema.pendingOperation.id);
        return rows.map((r) => JSON.parse(r.payload) as { id_denomination: number; active: boolean });
    },

    async cancelCreateByClientId(clientId: string): Promise<void> {
        await db
            .delete(schema.pendingOperation)
            .where(
                and(
                    eq(schema.pendingOperation.clientId, clientId),
                    eq(schema.pendingOperation.type, "create_transaction")
                )
            );
    },

    async markSuccess(clientId: string): Promise<void> {
        await db.delete(schema.pendingOperation).where(eq(schema.pendingOperation.clientId, clientId));
    },

    async markFailure(clientId: string, attempts: number, nextRetryAt: string): Promise<void> {
        await db
            .update(schema.pendingOperation)
            .set({ attempts, nextRetryAt, updatedAt: new Date().toISOString() })
            .where(eq(schema.pendingOperation.clientId, clientId));
    },

    async markExhausted(clientId: string): Promise<void> {
        await db
            .update(schema.pendingOperation)
            .set({ attempts: 5, updatedAt: new Date().toISOString() })
            .where(eq(schema.pendingOperation.clientId, clientId));
    },

    /**
     * Reactiva operaciones que quedaron agotadas. Necesario porque una caída
     * de red podía consumir los intentos y dejar el cierre sin sincronizar
     * para siempre; al arrancar se les da una nueva oportunidad.
     */
    async recoverExhausted(): Promise<void> {
        await db
            .update(schema.pendingOperation)
            .set({ attempts: 0, nextRetryAt: null, updatedAt: new Date().toISOString() })
            .where(gte(schema.pendingOperation.attempts, schema.pendingOperation.maxAttempts));
    },

    async clearAll(): Promise<void> {
        await db.delete(schema.pendingOperation);
    },
};
