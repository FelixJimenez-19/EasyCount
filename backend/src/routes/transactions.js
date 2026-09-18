import { Router } from "express";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validationError } from "../validation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

const router = Router();

// Límite práctico de la evidencia fotográfica recibida en base64 (~6 MB).
const MAX_EVIDENCE_BASE64_LENGTH = 8 * 1024 * 1024;

const saveEvidence = (evidence) => {
    if (!evidence || !evidence.base64) return null;
    if (typeof evidence.base64 !== "string" || evidence.base64.length > MAX_EVIDENCE_BASE64_LENGTH) {
        return { error: "Evidencia demasiado grande o inválida." };
    }

    const rawExt = path.extname(String(evidence.fileName ?? "")).toLowerCase();
    const ext = [".jpg", ".jpeg", ".png", ".webp", ".heic"].includes(rawExt) ? rawExt : ".jpg";
    const name = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;

    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_DIR, name), Buffer.from(evidence.base64, "base64"));
    return { path: name };
};

router.post("/", requireAuth, (req, res) => {
    const { total, observation, breakdown, clientId, evidence } = req.body || {};

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

    const savedEvidence = saveEvidence(evidence);
    if (savedEvidence?.error) {
        return validationError(res, { evidence: savedEvidence.error });
    }

    const fecha = new Date().toISOString();

    const save = db.transaction(() => {
        const result = db
            .prepare("INSERT INTO transactionn (date, total, observation, client_id, evidence_path) VALUES (?, ?, ?, ?, ?)")
            .run(fecha, total, observation || "Sin observación", clientId || null, savedEvidence?.path ?? null);

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

// Eliminación idempotente por `client_id` (el identificador que conoce el cliente).
router.delete("/:clientId", requireAuth, (req, res) => {
    const { clientId } = req.params;
    const row = db
        .prepare("SELECT id_transaction, evidence_path FROM transactionn WHERE client_id = ?")
        .get(clientId);

    if (!row) {
        // Ya no existe (o nunca existió): la operación se considera completada.
        return res.json({ deleted: false });
    }

    db.transaction(() => {
        db.prepare("DELETE FROM transactionn_denomination WHERE id_transaction = ?").run(row.id_transaction);
        db.prepare("DELETE FROM transactionn WHERE id_transaction = ?").run(row.id_transaction);
    })();

    if (row.evidence_path) {
        try {
            fs.unlinkSync(path.join(UPLOADS_DIR, row.evidence_path));
        } catch {
            // El archivo pudo haberse eliminado antes; no es un error bloqueante.
        }
    }

    return res.json({ deleted: true });
});

router.get("/", requireAuth, (_req, res) => {
    const rows = db
        .prepare(
            `SELECT
               t.id_transaction, t.client_id, t.date, t.total AS total_general, t.observation,
               CASE WHEN t.evidence_path IS NULL THEN NULL ELSE '/api/uploads/' || t.evidence_path END AS evidence,
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
