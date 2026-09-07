import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "@/db/schema";

const sqlite = SQLite.openDatabaseSync("easycount.db");

export const db = drizzle(sqlite);
export { schema };
export { sqlite };
