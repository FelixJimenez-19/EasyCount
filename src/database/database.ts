import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("easycount.db");

export const initDatabase = async (): Promise<void> => {
    try {
        db.execSync(`
      CREATE TABLE IF NOT EXISTS denomination (
        id_denomination INTEGER PRIMARY KEY AUTOINCREMENT,
        value DECIMAL(10,2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT 1
      );
    `);

        db.execSync(`
        CREATE TABLE IF NOT EXISTS transactionn (
        id_transaction INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATETIME NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        observation VARCHAR(255) NULL
      );
    `);

        db.execSync(`
      CREATE TABLE IF NOT EXISTS transactionn_denomination (
        id_transaction_denomination INTEGER PRIMARY KEY AUTOINCREMENT,
        id_transaction INTEGER,
        id_denomination INTEGER,
        quantity INTEGER NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (id_transaction) REFERENCES transactionn(id_transaction) ON DELETE CASCADE,
        FOREIGN KEY (id_denomination) REFERENCES denomination(id_denomination) ON DELETE CASCADE
      );
    `);

        db.execSync(`
      CREATE TABLE IF NOT EXISTS user (
        id_user INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      );
    `);

        db.execSync(`
      CREATE TABLE IF NOT EXISTS session (
        id INTEGER PRIMARY KEY,
        id_user INTEGER,
        FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE
      );
    `);

        console.log(" Correct Create Tables");

        await seedDenominaciones();
    } catch (error) {
        console.error("Error to start DB:", error);
    }
};

const seedDenominaciones = async (): Promise<void> => {
    try {
        const result: any = db.getFirstSync("SELECT COUNT(*) as count FROM denomination;");

        if (result && result.count === 0) {
            console.log("Starting bills and coins");

            const startvalue = [
                { value: 0.01, type: "Moneda", boolean: true },
                { value: 0.05, type: "Moneda", boolean: true },
                { value: 0.1, type: "Moneda", boolean: true },
                { value: 0.25, type: "Moneda", boolean: true },
                { value: 0.5, type: "Moneda", boolean: true },
                { value: 1.0, type: "Moneda", boolean: true },
                // Billetes
                { value: 1.0, type: "Billete", boolean: true },
                { value: 5.0, type: "Billete", boolean: true },
                { value: 10.0, type: "Billete", boolean: true },
                { value: 20.0, type: "Billete", boolean: true },
                { value: 50.0, type: "Billete", boolean: true },
                { value: 100.0, type: "Billete", boolean: true },
            ];

            for (const item of startvalue) {
                db.runSync("INSERT INTO denomination (value, type, active) VALUES (?, ?, ?);", [item.value, item.type, item.boolean]);
            }
            console.log("Correct Add Denominations");
        } else {
            console.log("Denominations already with dates");
        }
    } catch (error) {
        console.error("Error to load denominations:", error);
    }
};
