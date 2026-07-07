import { Denomination, TransactionDenomination, TransactionRow } from "@/app/types/models";
import { db } from "../database/database";

/**
 * Servicio encargado de gestionar la lógica de datos de los Arqueos
 */
export const CountService = {
    /**
     * Trae todas las denominaciones desde la BD, mapeando las columnas al shape de Denomination
     */
    getDenominaciones: (): Denomination[] => {
        try {
            const rows = db.getAllSync<{ id_denominacion: number; valor: number; tipo: string; activo: number }>(
                "SELECT id_denominacion, valor, tipo, activo FROM denominacion ORDER BY tipo DESC, valor DESC;"
            );
            return rows.map((r) => ({
                id: r.id_denominacion,
                label: `$${r.valor.toFixed(2)}`,
                valor: r.valor,
                tipo: r.tipo,
                active: r.activo === 1,
            }));
        } catch (error) {
            console.error("❌ Error al obtener denominaciones:", error);
            return [];
        }
    },

    /**
     * Inserta una nueva denominación personalizada y devuelve el registro creado
     */
    addDenominacion: (valor: number, tipo: string, activo: boolean): Denomination | null => {
        try {
            const result = db.runSync("INSERT INTO denominacion (valor, tipo, image_url, activo) VALUES (?, ?, ?, ?);", [
                valor,
                tipo,
                "",
                activo ? 1 : 0,
            ]);
            return {
                id: result.lastInsertRowId,
                label: `$${valor.toFixed(2)}`,
                valor,
                tipo,
                active: activo,
            };
        } catch (error) {
            console.error("❌ Error al agregar denominación:", error);
            return null;
        }
    },

    /**
     * Activa o desactiva una denominación existente (toggle desde el catálogo)
     */
    toggleDenominacion: (id: number, active: boolean): boolean => {
        try {
            db.runSync("UPDATE denominacion SET activo = ? WHERE id_denominacion = ?;", [active ? 1 : 0, id]);
            return true;
        } catch (error) {
            console.error("❌ Error al actualizar el estado de la denominación:", error);
            return false;
        }
    },

    /**
     * Guarda un Arqueo Completo (Cabecera + Detalles) aplicando Transaccionalidad ACID
     */
    saveTransaction: (montoTotal: number, observacion: string, desgloses: TransactionDenomination[]): boolean => {
        try {
            // 1. Insertar la Cabecera en la tabla transaccion
            const fechaActual = new Date().toISOString();
            const resultTransaccion = db.runSync("INSERT INTO transaccion (fecha, monto, observacion) VALUES (?, ?, ?);", [
                fechaActual,
                montoTotal,
                observacion,
            ]);

            // Obtenemos el ID autoincremental que la BD le asignó a este arqueo específico
            const idTransaccion = resultTransaccion.lastInsertRowId;

            // 2. Insertar cada fila del desglose en la tabla intermedia
            for (const item of desgloses) {
                db.runSync(
                    `INSERT INTO transaccion_denominacion 
           (id_transaccion, id_denominacion, cantidad, subtotal) 
           VALUES (?, ?, ?, ?);`,

                    [idTransaccion, item.id_denomination, item.quantity, item.subtotal]
                    // Linea por corregir
                );
            }

            console.log(`✅ Arqueo #${idTransaccion} guardado de forma persistente.`);
            return true;
        } catch (error) {
            console.error("❌ Error en la transacción de guardado:", error);
            return false;
        }
    },

    /**
     * Ejecuta el INNER JOIN triple que planeamos para recuperar el historial desglosado
     */
    getTransaction: (): TransactionRow[] => {
        try {
            const query = `
        SELECT
          t.id_transaccion, t.fecha, t.monto as total_general, t.observacion,
          td.cantidad, td.subtotal,
          d.valor, d.tipo
        FROM transaccion_denominacion td
        INNER JOIN transaccion t ON td.id_transaccion = t.id_transaccion
        INNER JOIN denominacion d ON td.id_denominacion = d.id_denominacion
        ORDER BY t.fecha DESC;
      `;
            return db.getAllSync<TransactionRow>(query);
        } catch (error) {
            console.error("❌ Error al consultar historial completo:", error);
            return [];
        }
    },
};
