import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "@/db/schema";

// Versión del esquema local. Súbela cuando cambie la estructura de las tablas:
// en el siguiente arranque se recrean desde cero. Los datos viven solo en el
// dispositivo, así que es preferible un esquema limpio y conocido antes que
// arrastrar tablas viejas de otras versiones o ramas.
const SCHEMA_VERSION = 1;

let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqliteInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

const DROP_SCHEMA_SQL = `
    DROP TABLE IF EXISTS transaction_denomination;
    DROP TABLE IF EXISTS "transaction";
    DROP TABLE IF EXISTS denomination;
    DROP TABLE IF EXISTS user;
`;

const CREATE_SCHEMA_SQL = `
    CREATE TABLE IF NOT EXISTS denomination (
        id_denomination INTEGER PRIMARY KEY AUTOINCREMENT,
        value REAL NOT NULL,
        type TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "transaction" (
        id_transaction INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL UNIQUE,
        date TEXT NOT NULL,
        total REAL NOT NULL,
        observation TEXT,
        evidence_uri TEXT,
        synced INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS transaction_synced_idx ON "transaction" (synced);

    CREATE TABLE IF NOT EXISTS transaction_denomination (
        id_transaction_denomination INTEGER PRIMARY KEY AUTOINCREMENT,
        id_transaction INTEGER NOT NULL,
        id_denomination INTEGER NOT NULL,
        label TEXT NOT NULL,
        value REAL NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (id_transaction) REFERENCES "transaction"(id_transaction) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user (
        id_user INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
`;

/**
 * Crea el esquema local de forma idempotente. Si la base quedó de una versión
 * anterior (o de otra rama con un esquema distinto), se recrea por completo
 * usando `PRAGMA user_version` como control de versión. Esto elimina los
 * errores de "table already exists" que dejaban la app sin datos.
 */
async function ensureSchema(sqlite: SQLite.SQLiteDatabase): Promise<void> {
    const row = await sqlite.getFirstAsync<{ user_version: number }>("PRAGMA user_version;");
    const current = row?.user_version ?? 0;

    if (current < SCHEMA_VERSION) {
        await sqlite.execAsync(DROP_SCHEMA_SQL);
        await sqlite.execAsync(CREATE_SCHEMA_SQL);
        await sqlite.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
        return;
    }

    await sqlite.execAsync(CREATE_SCHEMA_SQL);
}

export function initDb(): Promise<void> {
    if (!initPromise) {
        initPromise = SQLite.openDatabaseAsync("easycount.db").then(async (sqlite) => {
            await sqlite.execAsync("PRAGMA foreign_keys = ON;");
            await ensureSchema(sqlite);
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
