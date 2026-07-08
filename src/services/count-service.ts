import { Denomination, TransactionDenomination, TransactionRow } from "@/app/types/models";
import { db } from "../database/database";

export const CountService = {
    getDenominaciones: (): Denomination[] => {
        try {
            const rows = db.getAllSync<{ id_denomination: number; value: number; type: string; active: number }>(
                "SELECT id_denomination, value, type, active FROM denomination ORDER BY type DESC, value DESC;"
            );
            return rows.map((r) => ({
                id_denomination: r.id_denomination,
                label: `$${r.value.toFixed(2)}`,
                value: r.value,
                type: r.type,
                active: r.active === 1,
            }));
        } catch (error) {
            console.error("Error to get Denominations:", error);
            return [];
        }
    },

    addDenominacion: (value: number, type: string, active: boolean): Denomination | null => {
        try {
            const result = db.runSync("INSERT INTO denomination (value, type, active) VALUES (?, ?, ?);", [value, type, active ? 1 : 0]);
            return {
                id_denomination: result.lastInsertRowId,
                label: `$${value.toFixed(2)}`,
                value: value,
                type: type,
                active: active,
            };
        } catch (error) {
            console.error("Error to add Denomination:", error);
            return null;
        }
    },

    toggleDenominacion: (id: number, active: boolean): boolean => {
        try {
            db.runSync("UPDATE denomination SET active = ? WHERE id_denomination = ?;", [active ? 1 : 0, id]);
            return true;
        } catch (error) {
            console.error("Error to update Denomination status:", error);
            return false;
        }
    },

    saveTransaction: (montoTotal: number, observacion: string, desgloses: TransactionDenomination[]): boolean => {
        try {
            const fechaActual = new Date().toISOString();
            const resultTransaccion = db.runSync("INSERT INTO transactionn (date, total, observation) VALUES (?, ?, ?);", [
                fechaActual,
                montoTotal,
                observacion,
            ]);

            const idTransaccion = resultTransaccion.lastInsertRowId;

            for (const item of desgloses) {
                db.runSync(
                    `INSERT INTO transactionn_denomination 
           (id_transaction, id_denomination, quantity, subtotal) 
           VALUES (?, ?, ?, ?);`,

                    [idTransaccion, item.id_denomination, item.quantity, item.subtotal]
                );
            }

            console.log(`Conteo #${idTransaccion} saved.`);
            return true;
        } catch (error) {
            console.error("Error to save Transaction:", error);
            return false;
        }
    },

    getTransaction: (): TransactionRow[] => {
        try {
            const query = `
        SELECT
          t.id_transaction, t.date, t.total as total_general, t.observation,
          td.quantity, td.subtotal,
          d.value, d.type
        FROM transactionn_denomination td
        INNER JOIN transactionn t ON td.id_transaction = t.id_transaction
        INNER JOIN denomination d ON td.id_denomination = d.id_denomination
        ORDER BY t.date DESC;
      `;
            return db.getAllSync<TransactionRow>(query);
        } catch (error) {
            console.error("Error to get Transaction:", error);
            return [];
        }
    },
};
