import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

//  Catálogo de denominaciones (caché local).
//  Se rellena desde la API cuando hay conexión y sirve de respaldo offline.

export const denomination = sqliteTable("denomination", {
    id: integer("id_denomination").primaryKey({ autoIncrement: true }),
    value: real("value").notNull(),
    type: text("type").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    updatedAt: text("updated_at").notNull(),
});

//   Entidad principal: el conteo / cierre de caja.
//   `clientId` es el identificador único generado en el cliente para garantizar
//   idempotencia durante la sincronización.

export const transaction = sqliteTable(
    "transaction",
    {
        id: integer("id_transaction").primaryKey({ autoIncrement: true }),
        clientId: text("client_id").notNull().unique(),
        date: text("date").notNull(),
        total: real("total").notNull(),
        observation: text("observation"),
        evidenceUri: text("evidence_uri"),
        synced: integer("synced", { mode: "boolean" }).notNull().default(false),
        createdAt: text("created_at").notNull(),
    },
    (t) => [index("transaction_synced_idx").on(t.synced)]
);

//  Desglose de cada conteo (relación con denomination).

export const transactionDenomination = sqliteTable("transaction_denomination", {
    id: integer("id_transaction_denomination").primaryKey({ autoIncrement: true }),
    transactionId: integer("id_transaction")
        .notNull()
        .references(() => transaction.id, { onDelete: "cascade" }),
    denominationId: integer("id_denomination").notNull(),
    label: text("label").notNull(),
    value: real("value").notNull(),
    quantity: integer("quantity").notNull(),
    subtotal: real("subtotal").notNull(),
});
