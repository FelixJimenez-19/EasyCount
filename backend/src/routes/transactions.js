import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, (req, res) => {
    const { total, observation, breakdown } = req.body || {};

    if (typeof total !== "number") {
        return res.status(400).json({ message: "El total es obligatorio." });
    }
    if (!Array.isArray(breakdown)) {
        return res.status(400).json({ message: "El desglose es obligatorio." });
    }

    const fecha = new Date().toISOString();

    const save = db.transaction(() => {
        const result = db
            .prepare("INSERT INTO transactionn (date, total, observation) VALUES (?, ?, ?)")
            .run(fecha, total, observation || "Sin observación");

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
               t.id_transaction, t.date, t.total AS total_general, t.observation,
               td.quantity, td.subtotal,
               d.value, d.type
             FROM transactionn_denomination td
             INNER JOIN transactionn t ON td.id_transaction = t.id_transaction
             INNER JOIN denomination d ON td.id_denomination = d.id_denomination
             ORDER BY t.date DESC`
        )
        .all();

    return res.json(rows);
});

export default router;
