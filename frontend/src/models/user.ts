import { z } from "zod";

/**
 * Usuario (contrato del servidor).
 *
 * Divergencias de nomenclatura con el servidor: ninguna en este caso; la API
 * y el dominio usan los mismos campos `id_user`, `username`, `email`, `created_at`.
 */
export const UserSchema = z.object({
    id_user: z.number(),
    username: z.string(),
    email: z.string(),
    created_at: z.string(),
});

export type User = z.infer<typeof UserSchema>;
