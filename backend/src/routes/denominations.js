import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validationError } from "../validation.js";

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

    const errors = {};
    if (typeof value !== "number" || value <= 0) {
        errors.value = "El valor debe ser mayor a $0.00.";
    }
    if (!["Billete", "Moneda"].includes(type)) {
        errors.type = "El tipo debe ser Billete o Moneda.";
    }
    if (Object.keys(errors).length > 0) {
        return validationError(res, errors);
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
    const { active, updatedAt } = req.body || {};

    if (typeof active !== "boolean") {
        return validationError(res, { active: "El campo active es obligatorio." });
    }

    const row = db
        .prepare("SELECT id_denomination, updated_at FROM denomination WHERE id_denomination = ?")
        .get(id);
    if (!row) {
        return res.status(404).json({ message: "Denominación no encontrada." });
    }

    // Resolución de conflictos "last-write-wins": la escritura más reciente gana.
    if (updatedAt) {
        const incoming = new Date(updatedAt).getTime();
        const current = row.updated_at ? new Date(row.updated_at).getTime() : 0;
        if (incoming <= current) {
            return res.status(409).json({ message: "Escritura obsoleta; el servidor conserva el valor más reciente." });
        }
    }

    const nextUpdatedAt = updatedAt || new Date().toISOString();
    db.prepare("UPDATE denomination SET active = ?, updated_at = ? WHERE id_denomination = ?").run(active ? 1 : 0, nextUpdatedAt, id);

    const updated = db
        .prepare("SELECT id_denomination, value, type, active FROM denomination WHERE id_denomination = ?")
        .get(id);

    return res.json(toDenomination(updated));
});

export default router;
