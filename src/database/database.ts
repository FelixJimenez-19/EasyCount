import * as SQLite from "expo-sqlite";

// Abrimos o creamos el archivo físico de la base de datos en el almacenamiento interno del móvil
export const db = SQLite.openDatabaseSync("easycount.db");

/**
 * Inicializa las tablas de la base de datos si no existen
 * Respetando la nomenclatura de tu Diagrama Entidad-Relación
 */
export const initDatabase = async (): Promise<void> => {
    try {
        // 1. Creación de la tabla maestra de Denominaciones (Billetes y Monedas de que queremos registrar ps)
        db.execSync(`
      CREATE TABLE IF NOT EXISTS denominacion (
        id_denominacion INTEGER PRIMARY KEY AUTOINCREMENT,
        valor DECIMAL(10,2) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        image_url VARCHAR(255) NULL
      );
    `);

        db.execSync(`
      CREATE TABLE IF NOT EXISTS transaccion (
        id_transaccion INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha DATETIME NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        observacion VARCHAR(255) NULL
      );
    `);

        db.execSync(`
      CREATE TABLE IF NOT EXISTS transaccion_denominacion (
        id_transaccion_denominacion INTEGER PRIMARY KEY AUTOINCREMENT,
        id_transaccion INTEGER,
        id_denominacion INTEGER,
        cantidad INTEGER NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (id_transaccion) REFERENCES transaccion(id_transaccion) ON DELETE CASCADE,
        FOREIGN KEY (id_denominacion) REFERENCES denominacion(id_denominacion)
      );
    `);

        console.log("✅ Estructura de tablas verificada/creada con éxito.");

        // Ejecutamos el pre-llenado de las monedas una vez creadas las tablas
        await seedDenominaciones();
    } catch (error) {
        console.error("❌ Error al inicializar la base de datos:", error);
    }
};

/**
 * Inserta el catálogo de monedas y billetes oficiales de Ecuador si la tabla está vacía (Seeding)
 */
const seedDenominaciones = async (): Promise<void> => {
    try {
        // Verificamos si ya existen registros previos para no duplicar datos
        const result: any = db.getFirstSync("SELECT COUNT(*) as count FROM denominacion;");

        if (result && result.count === 0) {
            console.log("🌱 Inicializando el catálogo de monedas de Ecuador...");

            const valoresIniciales = [
                { valor: 0.01, tipo: "Moneda" },
                { valor: 0.05, tipo: "Moneda" },
                { valor: 0.1, tipo: "Moneda" },
                { valor: 0.25, tipo: "Moneda" },
                { valor: 0.5, tipo: "Moneda" },
                { valor: 1.0, tipo: "Moneda" },
                // Billetes
                { valor: 1.0, tipo: "Billete" },
                { valor: 5.0, tipo: "Billete" },
                { valor: 10.0, tipo: "Billete" },
                { valor: 20.0, tipo: "Billete" },
                { valor: 50.0, tipo: "Billete" },
                { valor: 100.0, tipo: "Billete" },
            ];

            // Preparamos la inserción masiva de datos en bloque
            for (const item of valoresIniciales) {
                db.runSync("INSERT INTO denominacion (valor, tipo, image_url) VALUES (?, ?, ?);", [item.valor, item.tipo, ""]);
            }
            console.log("🌱 Catálogo de denominaciones precargado con éxito.");
        } else {
            console.log("🪙 El catálogo de denominaciones ya cuenta con datos.");
        }
    } catch (error) {
        console.error("❌ Error al precargar las denominaciones:", error);
    }
};
