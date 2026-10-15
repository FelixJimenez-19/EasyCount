import * as SecureStore from "expo-secure-store";
import { logger } from "../utils/logger";

const USER_ID_KEY = "easycount_current_user_id";

let currentUserId: number | null = null;

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

/**
 * Sesión local: la app no usa tokens de servidor. Solo se recuerda, cifrado
 * en SecureStore, el id del usuario con sesión iniciada en este dispositivo.
 */
export const AuthStore = {
    getUserId(): number | null {
        return currentUserId;
    },

    isLoggedIn(): boolean {
        return currentUserId !== null;
    },

    async hydrate(): Promise<void> {
        try {
            const raw = await SecureStore.getItemAsync(USER_ID_KEY);
            currentUserId = raw ? Number(raw) : null;
        } catch (error) {
            logger.error("Error hydrating auth store:", error);
            currentUserId = null;
        }
    },

    async setSession(userId: number): Promise<void> {
        currentUserId = userId;
        try {
            await SecureStore.setItemAsync(USER_ID_KEY, String(userId));
        } catch (error) {
            logger.error("Error persisting session:", error);
        }
    },

    async clear(): Promise<void> {
        currentUserId = null;
        try {
            await SecureStore.deleteItemAsync(USER_ID_KEY);
        } catch (error) {
            logger.error("Error clearing session:", error);
        }
    },

    onSessionExpired(listener: SessionExpiredListener): () => void {
        sessionExpiredListeners.add(listener);
        return () => sessionExpiredListeners.delete(listener);
    },

    notifySessionExpired(): void {
        sessionExpiredListeners.forEach((listener) => listener());
    },
};
