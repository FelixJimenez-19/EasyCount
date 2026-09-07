import { eq } from "drizzle-orm";
import { db, schema } from "../client";
import type { Denomination } from "@/app/types/models";

const toModel = (r: typeof schema.denomination.$inferSelect): Denomination => ({
    id_denomination: r.id,
    value: r.value,
    type: r.type,
    active: r.active,
    label: `$${Number(r.value).toFixed(2)}`,
});

export const DenominationsRepo = {
    async replaceAll(items: Denomination[]): Promise<void> {
        await db.delete(schema.denomination);
        if (items.length === 0) return;
        await db.insert(schema.denomination).values(
            items.map((d) => ({
                id: d.id_denomination,
                value: d.value,
                type: d.type,
                active: d.active,
                updatedAt: new Date().toISOString(),
            }))
        );
    },

    async getAll(): Promise<Denomination[]> {
        const rows = await db.select().from(schema.denomination);
        return rows
            .map(toModel)
            .sort((a, b) => b.value - a.value);
    },

    async toggleLocal(id: number, active: boolean): Promise<void> {
        await db
            .update(schema.denomination)
            .set({ active, updatedAt: new Date().toISOString() })
            .where(eq(schema.denomination.id, id));
    },

    async clearAll(): Promise<void> {
        await db.delete(schema.denomination);
    },
};
