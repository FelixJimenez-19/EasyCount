import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validationError } from "../validation.js";

const router = Router();

router.post("/", requireAuth, (req, res) => {
    const { total, observation, breakdown, clientId } = req.body || {};

    const errors = {};
    if (typeof total !== "number") {
        errors.total = "El total es obligatorio.";
    }
    if (!Array.isArray(breakdown)) {
        errors.breakdown = "El desglose es obligatorio.";
    }
    if (Object.keys(errors).length > 0) {
        return validationError(res, errors);
    }

    // Idempotencia: si la operación ya fue procesada con el mismo clientId, se devuelve la existente.
    if (clientId) {
        const existing = db.prepare("SELECT id_transaction FROM transactionn WHERE client_id = ?").get(clientId);
        if (existing) {
            return res.status(200).json({
                id_transaction: existing.id_transaction,
                total,
                observation: observation || "Sin observación",
                duplicated: true,
            });
        }
    }

    const fecha = new Date().toISOString();

    const save = db.transaction(() => {
        const result = db
            .prepare("INSERT INTO transactionn (date, total, observation, client_id) VALUES (?, ?, ?, ?)")
            .run(fecha, total, observation || "Sin observación", clientId || null);

        const idTransaction = result.lastInsertRowid;

        if (breakdown.length > 0) {
            const insert = db.prepare(
                "INSERT INTO transactionn_denomination (id_transaction, id_denomination, quantity, subtotal) VALUES (?, ?, ?, ?)"
            );
            for (const item of breakdown) {
                insert.run(idTransaction, item.id_denomination, item.quantity, item.subtotal);
            }
        }

        return idTransaction;
    });

    const idTransaction = save();

    return res.status(201).json({ id_transaction: idTransaction, total, observation: observation || "Sin observación" });
});

router.get("/", requireAuth, (_req, res) => {
    const rows = db
        .prepare(
            `SELECT
               t.id_transaction, t.client_id, t.date, t.total AS total_general, t.observation,
               td.quantity, td.subtotal,
               d.id_denomination, d.value, d.type
             FROM transactionn_denomination td
             INNER JOIN transactionn t ON td.id_transaction = t.id_transaction
             INNER JOIN denomination d ON td.id_denomination = d.id_denomination
             ORDER BY t.date DESC`
        )
        .all();

    return res.json(rows);
});

export default router;
