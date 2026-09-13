import * as SecureStore from "expo-secure-store";
import { logger } from "../utils/logger";

const TOKEN_KEY = "easycount_token";
const REFRESH_TOKEN_KEY = "easycount_refresh_token";

let token: string | null = null;
let refreshToken: string | null = null;

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export const AuthStore = {
    getToken(): string | null {
        return token;
    },

    getRefreshToken(): string | null {
        return refreshToken;
    },

    isLoggedIn(): boolean {
        return token !== null;
    },

    async hydrate(): Promise<void> {
        try {
            [token, refreshToken] = await Promise.all([
                SecureStore.getItemAsync(TOKEN_KEY),
                SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
            ]);
        } catch (error) {
            logger.error("Error hydrating auth store:", error);
            token = null;
            refreshToken = null;
        }
    },

    async setTokens(newToken: string, newRefreshToken: string): Promise<void> {
        token = newToken;
        refreshToken = newRefreshToken;
        try {
            await Promise.all([
                SecureStore.setItemAsync(TOKEN_KEY, newToken),
                SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken),
            ]);
        } catch (error) {
            logger.error("Error persisting tokens:", error);
        }
    },

    async setToken(newToken: string): Promise<void> {
        token = newToken;
        try {
            await SecureStore.setItemAsync(TOKEN_KEY, newToken);
        } catch (error) {
            logger.error("Error persisting token:", error);
        }
    },

    async clear(): Promise<void> {
        token = null;
        refreshToken = null;
        try {
            await Promise.all([
                SecureStore.deleteItemAsync(TOKEN_KEY),
                SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
            ]);
        } catch (error) {
            logger.error("Error clearing tokens:", error);
        }
    },

    onSessionExpired(listener: SessionExpiredListener): () => void {
        sessionExpiredListeners.add(listener);
        return () => {
            sessionExpiredListeners.delete(listener);
        };
    },

    notifySessionExpired(): void {
        for (const listener of sessionExpiredListeners) listener();
    },
};
