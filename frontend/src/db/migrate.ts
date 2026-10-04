import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "@/drizzle/migrations";
import { db, initDb } from "./client";

let migrated = false;

export async function runMigrations(): Promise<void> {
    if (migrated) return;
    await initDb();
    await migrate(db, migrations);
    migrated = true;
}
