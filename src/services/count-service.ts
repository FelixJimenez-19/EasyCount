import { Denomination, Transaction } from "@/app/types/models";
import { db } from "../database/database";

// 1. Interfaces de TypeScript para garantizar el tipado estático seguro
// export interface Denominacion {
//     id_denominacion: number;
//     valor: number;
//     tipo: string;
//     image_url: string;
// }

export interface DetalleConteo {
    id_denominacion: number;
    cantidad: number;
    subtotal: number;
}

/**
 * Servicio encargado de gestionar la lógica de datos de los Arqueos
 */
export const CountService = {
    /**
     * Trae todas las denominaciones oficiales activas desde la BD
     */
    getDenominaciones: (): Denomination[] => {
        try {
            // Usamos el método sincrónico o asincrónico para obtener las filas mapeadas
            const rows = db.getAllSync<Denomination>("SELECT * FROM denominacion ORDER BY tipo DESC, valor DESC;");
            return rows;
        } catch (error) {
            console.error("❌ Error al obtener denominaciones:", error);
            return [];
        }
    },

    /**
     * Guarda un Arqueo Completo (Cabecera + Detalles) aplicando Transaccionalidad ACID
     */
    saveTransaction: (montoTotal: number, observacion: string, desgloses: Transaction[]): boolean => {
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

                    [idTransaccion, item.id, item.total, item.total]
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
    getHistorialCompleto: () => {
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
            return db.getAllSync(query);
        } catch (error) {
            console.error("❌ Error al consultar historial completo:", error);
            return [];
        }
    },
};
