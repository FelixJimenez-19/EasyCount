import { getSqlite } from "../client";

export interface LocalUser {
    id_user: number;
    username: string;
    email: string;
    created_at: string;
}

interface UserRow extends LocalUser {
    password: string;
}

/**
 * Acceso a la tabla local `user`. Sustituye a la antigua fuente remota:
 * las cuentas y sus contraseñas (hash SHA-256) viven en el dispositivo.
 */
export const UsersRepo = {
    async findByEmail(email: string): Promise<UserRow | null> {
        const row = await getSqlite().getFirstAsync<UserRow>(
            "SELECT id_user, username, email, password, created_at FROM user WHERE email = ? COLLATE NOCASE LIMIT 1;",
            email
        );
        return row ?? null;
    },

    async getById(id: number): Promise<LocalUser | null> {
        const row = await getSqlite().getFirstAsync<LocalUser>(
            "SELECT id_user, username, email, created_at FROM user WHERE id_user = ? LIMIT 1;",
            id
        );
        return row ?? null;
    },

    async create(username: string, email: string, passwordHash: string): Promise<LocalUser> {
        const now = new Date().toISOString();
        const result = await getSqlite().runAsync(
            "INSERT INTO user (username, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?);",
            username,
            email,
            passwordHash,
            now,
            now
        );
        return { id_user: result.lastInsertRowId, username, email, created_at: now };
    },

    async clearAll(): Promise<void> {
        await getSqlite().execAsync("DELETE FROM user;");
    },
};
