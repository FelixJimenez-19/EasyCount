import { z } from "zod";

/**
 * Fila plana que devuelve `GET /api/transactions` (una fila por denominación).
 *
 * Divergencias de nomenclatura con el servidor:
 * - `total_general` (GET) corresponde al `total` que el cliente envía en POST.
 * - `client_id` (servidor) es `clientId` en la BD local y en el payload POST.
 * - `id_transaction` es numérico en el servidor, pero en el dominio se usa como string.
 * - `label` NO llega del servidor; se deriva en el cliente como `$${value}`.
 */
export const TransactionRowSchema = z.object({
    id_transaction: z.number(),
    client_id: z.string().nullable(),
    date: z.string(),
    total_general: z.number(),
    observation: z.string(),
    evidence: z.string().nullable().optional(),
    id_denomination: z.number(),
    quantity: z.number(),
    subtotal: z.number(),
    value: z.number(),
    type: z.string(),
});

export type TransactionRow = z.infer<typeof TransactionRowSchema>;

export const parseTransactionRows = (data: unknown): TransactionRow[] =>
    z.array(TransactionRowSchema).parse(data);

/**
 * Desglose que envía el cliente al crear una transacción.
 * `label` es informativo para la UI y no se persiste en el servidor.
 */
export const TransactionBreakdownSchema = z.object({
    id_denomination: z.number(),
    value: z.number(),
    label: z.string(),
    quantity: z.number(),
    subtotal: z.number(),
});

export type TransactionBreakdown = z.infer<typeof TransactionBreakdownSchema>;

/** Referencia mínima denominación/cantidad/subtotal. */
export const TransactionDenominationSchema = z.object({
    id_denomination: z.number(),
    quantity: z.number(),
    subtotal: z.number(),
});

export type TransactionDenomination = z.infer<typeof TransactionDenominationSchema>;

/**
 * Ítem de desglose en el dominio de UI: `qty` (UI) == `quantity` (servidor).
 */
export const TransactionItemSchema = z.object({
    label: z.string(),
    value: z.number(),
    qty: z.number(),
    subtotal: z.number(),
});

export type TransactionItem = z.infer<typeof TransactionItemSchema>;

/**
 * Transacción en el dominio. `date` llega como string ISO del servidor y aquí
 * se deserializa a `Date` (serialización generada con zod).
 */
export const TransactionSchema = z.object({
    id_transaction: z.string(),
    date: z.coerce.date(),
    total: z.number(),
    observation: z.string(),
    evidence: z.string().nullable(),
    breakdown: z.array(TransactionItemSchema),
});

export type Transaction = z.infer<typeof TransactionSchema>;
