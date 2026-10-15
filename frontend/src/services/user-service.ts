import type { User } from "@/src/models/user";
import { UsersRepo } from "@/src/db/repositories/users";
import { CryptoUtil } from "@/src/utilities/crypto";
import { logger } from "@/src/utils/logger";
import { AuthStore } from "./auth-store";

type AuthResult = { success: boolean; user?: User; message?: string };

const toUser = (row: { id_user: number; username: string; email: string; created_at: string }): User => ({
    id_user: row.id_user,
    username: row.username,
    email: row.email,
    created_at: row.created_at,
});

/**
 * Autenticación 100% local: las cuentas se guardan en el dispositivo y la
 * contraseña se verifica con SHA-256. No hay servidor ni tokens.
 */
export const UserService = {
    async register(username: string, email: string, password: string): Promise<AuthResult> {
        try {
            const existing = await UsersRepo.findByEmail(email);
            if (existing) {
                return { success: false, message: "Ese correo ya está registrado en este dispositivo." };
            }
            const created = await UsersRepo.create(username, email, CryptoUtil.hashPassword(password));
            return { success: true, user: toUser(created) };
        } catch (error) {
            logger.error("Error registering user:", error);
            return { success: false, message: "Error al registrar el usuario." };
        }
    },

    async login(email: string, password: string): Promise<AuthResult> {
        try {
            const row = await UsersRepo.findByEmail(email);
            if (!row || !CryptoUtil.verifyPassword(password, row.password)) {
                return { success: false, message: "Correo o contraseña incorrectos." };
            }
            await AuthStore.setSession(row.id_user);
            return { success: true, user: toUser(row) };
        } catch (error) {
            logger.error("Error logging in:", error);
            return { success: false, message: "Error al iniciar sesión." };
        }
    },

    async getCurrentUser(): Promise<User | null> {
        try {
            const id = AuthStore.getUserId();
            if (id === null) return null;
            const row = await UsersRepo.getById(id);
            return row ? toUser(row) : null;
        } catch (error) {
            logger.error("Error getting current user:", error);
            return null;
        }
    },

    async logout(): Promise<boolean> {
        try {
            await AuthStore.clear();
            return true;
        } catch (error) {
            logger.error("Error logging out:", error);
            return false;
        }
    },

    isLoggedIn(): boolean {
        return AuthStore.isLoggedIn();
    },
};
