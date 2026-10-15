import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "@/db/schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqliteInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Tablas propias del modo local (no gestionadas por drizzle): la cuenta de
 * usuario y su sesión. Se crean una sola vez, de forma idempotente.
 */
async function ensureLocalTables(sqlite: SQLite.SQLiteDatabase): Promise<void> {
    await sqlite.execAsync(`
        CREATE TABLE IF NOT EXISTS user (
            id_user INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
    `);
}

export function initDb(): Promise<void> {
    if (!initPromise) {
        initPromise = SQLite.openDatabaseAsync("easycount.db").then(async (sqlite) => {
            await ensureLocalTables(sqlite);
            sqliteInstance = sqlite;
            dbInstance = drizzle(sqlite);
        });
    }
    return initPromise;
}

/** Instancia cruda de expo-sqlite para las tablas locales (usuario/sesión). */
export function getSqlite(): SQLite.SQLiteDatabase {
    if (!sqliteInstance) {
        throw new Error("[EasyCount] La base de datos aún no está inicializada. Llama a initDb() primero.");
    }
    return sqliteInstance;
}

function requireDb(): ReturnType<typeof drizzle> {
    if (!dbInstance) {
        throw new Error("[EasyCount] La base de datos aún no está inicializada. Llama a initDb() primero.");
    }
    return dbInstance;
}

/**
 * Proxy hacia la instancia real de drizzle. La base se abre de forma
 * asíncrona (openDatabaseAsync) porque la API síncrona de expo-sqlite no
 * puede arrancar su Web Worker en frío en web; el proxy resuelve cada acceso
 * en tiempo de llamada, una vez que initDb() ya completó.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get(_target, prop) {
        const target = requireDb();
        const value = Reflect.get(target, prop, target);
        return typeof value === "function" ? value.bind(target) : value;
    },
});

export { schema };
