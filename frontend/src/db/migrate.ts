import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "@/drizzle/migrations";
import { db } from "./client";

let migrated = false;

export async function runMigrations(): Promise<void> {
    if (migrated) return;
    await migrate(db, migrations);
    migrated = true;
}
