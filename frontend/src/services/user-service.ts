import type { User } from "@/src/models/user";
import { clearAllLocalData } from "@/src/db/clear";
import { AuthRemote } from "@/src/data/remote/auth-remote";
import { toUserMessage } from "@/src/domain/errors";
import { logger } from "@/src/utils/logger";
import { AuthStore } from "./auth-store";
import { SyncEngine } from "./sync-engine";

type AuthResult = { success: boolean; user?: User; message?: string };

export const UserService = {
    async register(username: string, email: string, password: string): Promise<AuthResult> {
        try {
            const data = await AuthRemote.register(username, email, password);
            await AuthStore.setTokens(data.token, data.refreshToken);
            return { success: true, user: data.user };
        } catch (error) {
            logger.error("Error registering user:", error);
            return { success: false, message: toUserMessage(error, "Error al registrar el usuario.") };
        }
    },

    async login(email: string, password: string): Promise<AuthResult> {
        try {
            const data = await AuthRemote.login(email, password);
            await AuthStore.setTokens(data.token, data.refreshToken);
            return { success: true, user: data.user };
        } catch (error) {
            logger.error("Error logging in:", error);
            return { success: false, message: toUserMessage(error, "Error al iniciar sesión.") };
        }
    },

    async getCurrentUser(): Promise<User | null> {
        try {
            return await AuthRemote.me();
        } catch (error) {
            logger.error("Error getting current user:", error);
            return null;
        }
    },

    async logout(): Promise<boolean> {
        try {
            SyncEngine.stop();
            await clearAllLocalData();
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
