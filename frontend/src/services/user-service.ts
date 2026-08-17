import { User } from "@/app/types/models";
import { ApiError, api } from "./api-client";
import { AuthStore } from "./auth-store";

interface AuthResponse {
    user: User;
    token: string;
}

export const UserService = {
    async register(username: string, email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
        try {
            const data = await api.post<AuthResponse>("/auth/register", { username, email, password });
            await AuthStore.setToken(data.token);
            return { success: true, user: data.user };
        } catch (error) {
            console.error("Error registering user:", error);
            return { success: false, message: error instanceof ApiError ? error.message : "Error al registrar el usuario." };
        }
    },

    async login(email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
        try {
            const data = await api.post<AuthResponse>("/auth/login", { email, password });
            await AuthStore.setToken(data.token);
            return { success: true, user: data.user };
        } catch (error) {
            console.error("Error logging in:", error);
            return { success: false, message: error instanceof ApiError ? error.message : "Error al iniciar sesión." };
        }
    },

    async getCurrentUser(): Promise<User | null> {
        try {
            return await api.get<User>("/auth/me");
        } catch (error) {
            console.error("Error getting current user:", error);
            return null;
        }
    },

    async logout(): Promise<boolean> {
        try {
            await AuthStore.clear();
            return true;
        } catch (error) {
            console.error("Error logging out:", error);
            return false;
        }
    },

    isLoggedIn(): boolean {
        return AuthStore.isLoggedIn();
    },
};
