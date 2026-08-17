import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "easycount_token";

let token: string | null = null;

export const AuthStore = {
    getToken(): string | null {
        return token;
    },

    isLoggedIn(): boolean {
        return token !== null;
    },

    async hydrate(): Promise<void> {
        try {
            token = await SecureStore.getItemAsync(TOKEN_KEY);
        } catch (error) {
            console.error("Error hydrating auth store:", error);
            token = null;
        }
    },

    async setToken(newToken: string): Promise<void> {
        token = newToken;
        try {
            await SecureStore.setItemAsync(TOKEN_KEY, newToken);
        } catch (error) {
            console.error("Error persisting token:", error);
        }
    },

    async clear(): Promise<void> {
        token = null;
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
        } catch (error) {
            console.error("Error clearing token:", error);
        }
    },
};
