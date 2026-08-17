import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const db = new Database(path.join(__dirname, "..", "easycount.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS denomination (
    id_denomination INTEGER PRIMARY KEY AUTOINCREMENT,
    value DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS transactionn (
    id_transaction INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATETIME NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    observation VARCHAR(255) NULL
  );

  CREATE TABLE IF NOT EXISTS transactionn_denomination (
    id_transaction_denomination INTEGER PRIMARY KEY AUTOINCREMENT,
    id_transaction INTEGER,
    id_denomination INTEGER,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_transaction) REFERENCES transactionn(id_transaction) ON DELETE CASCADE,
    FOREIGN KEY (id_denomination) REFERENCES denomination(id_denomination) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user (
    id_user INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
  );
`);

export const seedDenominaciones = () => {
    const { count } = db.prepare("SELECT COUNT(*) AS count FROM denomination").get();
    if (count > 0) return;

    const startValue = [
        { value: 0.01, type: "Moneda" },
        { value: 0.05, type: "Moneda" },
        { value: 0.1, type: "Moneda" },
        { value: 0.25, type: "Moneda" },
        { value: 0.5, type: "Moneda" },
        { value: 1.0, type: "Moneda" },
        { value: 1.0, type: "Billete" },
        { value: 5.0, type: "Billete" },
        { value: 10.0, type: "Billete" },
        { value: 20.0, type: "Billete" },
        { value: 50.0, type: "Billete" },
        { value: 100.0, type: "Billete" },
    ];

    const insert = db.prepare("INSERT INTO denomination (value, type, active) VALUES (?, ?, 1)");
    const insertMany = db.transaction((items) => {
        for (const item of items) insert.run(item.value, item.type);
    });
    insertMany(startValue);
    console.log("Denominaciones iniciales creadas.");
};
