import { api } from "../../services/http/client";
import type { User } from "../../models/user";

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
}

export const AuthRemote = {
    register: (username: string, email: string, password: string) =>
        api.post<AuthResponse>("/auth/register", { username, email, password }),
    login: (email: string, password: string) =>
        api.post<AuthResponse>("/auth/login", { email, password }),
    me: () => api.get<User>("/auth/me"),
};
