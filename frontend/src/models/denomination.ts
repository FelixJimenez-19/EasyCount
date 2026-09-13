import { z } from "zod";

/**
 * Denominación (contrato del servidor).
 *
 * Divergencias de nomenclatura:
 * - Servidor: `id_denomination`, `active` es booleano y `label` se deriva
 *   (`$${value}`) y no se envía desde el cliente.
 * - SQLite local (`db/schema.ts`): la PK se llama `id`, `active` se guarda como
 *   entero 0/1 y existe una columna `updatedAt` para "last-write-wins".
 * El repositorio local (`DenominationsRepo`) hace el mapeo `id` -> `id_denomination`.
 */
export const DenominationSchema = z.object({
    id_denomination: z.number(),
    value: z.number(),
    type: z.string(),
    active: z.boolean(),
    label: z.string(),
});

export type Denomination = z.infer<typeof DenominationSchema>;
