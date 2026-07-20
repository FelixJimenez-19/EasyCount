import { User } from "@/app/types/models";
import { db } from "../database/database";
import { CryptoUtil } from "../utilities/crypto";

export const UserService = {
    register(username: string, email: string, password: string): { success: boolean; user?: User; message?: string } {
        try {
            const existing = db.getFirstSync<{ id_user: number }>("SELECT id_user FROM user WHERE email = ?;", [email]);
            if (existing) {
                return { success: false, message: "El correo ya está registrado." };
            }

            const hashedPassword = CryptoUtil.hashPassword(password);
            const now = new Date().toISOString();

            const result = db.runSync("INSERT INTO user (username, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?);", [
                username,
                email,
                hashedPassword,
                now,
                now,
            ]);

            const user: User = {
                id_user: result.lastInsertRowId,
                username,
                email,
                created_at: now,
            };

            db.runSync("INSERT OR REPLACE INTO session (id, id_user) VALUES (1, ?);", [user.id_user]);

            return { success: true, user };
        } catch (error) {
            console.error("Error registering user:", error);
            return { success: false, message: "Error al registrar el usuario." };
        }
    },

    login(email: string, password: string): { success: boolean; user?: User; message?: string } {
        try {
            const row = db.getFirstSync<{ id_user: number; username: string; email: string; password: string; created_at: string }>(
                "SELECT id_user, username, email, password, created_at FROM user WHERE email = ?;",
                [email]
            );

            if (!row) {
                return { success: false, message: "Correo o contraseña incorrectos." };
            }

            if (!CryptoUtil.verifyPassword(password, row.password)) {
                return { success: false, message: "Correo o contraseña incorrectos." };
            }

            const user: User = {
                id_user: row.id_user,
                username: row.username,
                email: row.email,
                created_at: row.created_at,
            };

            db.runSync("INSERT OR REPLACE INTO session (id, id_user) VALUES (1, ?);", [user.id_user]);

            return { success: true, user };
        } catch (error) {
            console.error("Error logging in:", error);
            return { success: false, message: "Error al iniciar sesión." };
        }
    },

    getCurrentUser(): User | null {
        try {
            // antes consultaba a la tabla session y la tabla user por separado
            // aqui tenia mi N+1  porque yo habia estado separando las consultas por columas en un cont session y row ahora los 2 estan en un row y con la sentencia completa
            const row = db.getFirstSync<{ id_user: number; username: string; email: string; created_at: string }>(
                `SELECT u.id_user, u.username, u.email, u.created_at 
                 FROM session s 
                 INNER JOIN user u ON s.id_user = u.id_user 
                 WHERE s.id = 1;`
            );

            if (!row) return null;

            return {
                id_user: row.id_user,
                username: row.username,
                email: row.email,
                created_at: row.created_at,
            };
        } catch (error) {
            console.error("Error getting current user:", error);
            return null;
        }
    },

    logout(): boolean {
        try {
            db.runSync("DELETE FROM session WHERE id = 1;");
            return true;
        } catch (error) {
            console.error("Error logging out:", error);
            return false;
        }
    },

    isLoggedIn(): boolean {
        const row = db.getFirstSync<{ id_user: number }>("SELECT id_user FROM session WHERE id = 1;");
        return row !== null && row.id_user != null;
    },
};
