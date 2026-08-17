import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const toDenomination = (row) => ({
    id_denomination: row.id_denomination,
    value: row.value,
    type: row.type,
    active: row.active === 1,
    label: `$${Number(row.value).toFixed(2)}`,
});

router.get("/", requireAuth, (_req, res) => {
    const rows = db
        .prepare("SELECT id_denomination, value, type, active FROM denomination ORDER BY type DESC, value DESC")
        .all();
    return res.json(rows.map(toDenomination));
});

router.post("/", requireAuth, (req, res) => {
    const { value, type, active } = req.body || {};

    if (typeof value !== "number" || value <= 0) {
        return res.status(400).json({ message: "El valor debe ser mayor a $0.00." });
    }
    if (!["Billete", "Moneda"].includes(type)) {
        return res.status(400).json({ message: "El tipo debe ser Billete o Moneda." });
    }

    const result = db
        .prepare("INSERT INTO denomination (value, type, active) VALUES (?, ?, ?)")
        .run(value, type, active ? 1 : 0);

    const row = db
        .prepare("SELECT id_denomination, value, type, active FROM denomination WHERE id_denomination = ?")
        .get(result.lastInsertRowid);

    return res.status(201).json(toDenomination(row));
});

router.patch("/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const { active } = req.body || {};

    if (typeof active !== "boolean") {
        return res.status(400).json({ message: "El campo active es obligatorio." });
    }

    const row = db
        .prepare("SELECT id_denomination FROM denomination WHERE id_denomination = ?")
        .get(id);
    if (!row) {
        return res.status(404).json({ message: "Denominación no encontrada." });
    }

    db.prepare("UPDATE denomination SET active = ? WHERE id_denomination = ?").run(active ? 1 : 0, id);

    const updated = db
        .prepare("SELECT id_denomination, value, type, active FROM denomination WHERE id_denomination = ?")
        .get(id);

    return res.json(toDenomination(updated));
});

export default router;
