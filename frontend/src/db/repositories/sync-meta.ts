import { eq } from "drizzle-orm";
import { db, schema } from "../client";

export const SyncMetaRepo = {
    async get(key: string): Promise<string | null> {
        const row = await db
            .select({ value: schema.syncMeta.value })
            .from(schema.syncMeta)
            .where(eq(schema.syncMeta.key, key));
        return row[0]?.value ?? null;
    },

    async set(key: string, value: string): Promise<void> {
        await db
            .insert(schema.syncMeta)
            .values({ key, value })
            .onConflictDoUpdate({ target: schema.syncMeta.key, set: { value } });
    },

    async clearAll(): Promise<void> {
        await db.delete(schema.syncMeta);
    },
};
