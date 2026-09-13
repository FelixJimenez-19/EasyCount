import bcrypt from "bcryptjs";
import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, signRefreshToken, signToken, verifyRefreshToken } from "../middleware/auth.js";
import { validationError } from "../validation.js";

const router = Router();

const toUser = (row) => ({
    id_user: row.id_user,
    username: row.username,
    email: row.email,
    created_at: row.created_at,
});

router.post("/register", (req, res) => {
    const { username, email, password } = req.body || {};

    const errors = {};
    if (!username) errors.username = "El usuario es obligatorio.";
    if (!email) errors.email = "El correo es obligatorio.";
    if (!password) {
        errors.password = "La contraseña es obligatoria.";
    } else if (String(password).length < 6) {
        errors.password = "La contraseña debe tener al menos 6 caracteres.";
    }
    if (Object.keys(errors).length > 0) {
        return validationError(res, errors);
    }

    const existing = db.prepare("SELECT id_user FROM user WHERE email = ?").get(email);
    if (existing) {
        return res.status(409).json({ message: "El correo ya está registrado." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    const result = db
        .prepare("INSERT INTO user (username, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
        .run(username, email, hashedPassword, now, now);

    const user = toUser(db.prepare("SELECT * FROM user WHERE id_user = ?").get(result.lastInsertRowid));

    return res.status(201).json({ user, token: signToken(user), refreshToken: signRefreshToken(user) });
});

router.post("/login", (req, res) => {
    const { email, password } = req.body || {};

    const errors = {};
    if (!email) errors.email = "El correo es obligatorio.";
    if (!password) errors.password = "La contraseña es obligatoria.";
    if (Object.keys(errors).length > 0) {
        return validationError(res, errors);
    }

    const row = db.prepare("SELECT * FROM user WHERE email = ?").get(email);
    if (!row || !bcrypt.compareSync(password, row.password)) {
        return res.status(401).json({ message: "Correo o contraseña incorrectos." });
    }

    const user = toUser(row);
    return res.json({ user, token: signToken(user), refreshToken: signRefreshToken(user) });
});

router.post("/refresh", (req, res) => {
    const { refreshToken } = req.body || {};

    if (!refreshToken) {
        return validationError(res, { refreshToken: "Refresh token requerido." });
    }

    let payload;
    try {
        payload = verifyRefreshToken(refreshToken);
    } catch {
        return res.status(401).json({ message: "Refresh token inválido o expirado." });
    }

    if (payload.type !== "refresh") {
        return res.status(401).json({ message: "Token no es de refresco." });
    }

    const row = db.prepare("SELECT * FROM user WHERE id_user = ?").get(payload.id_user);
    if (!row) {
        return res.status(401).json({ message: "Usuario no encontrado." });
    }

    const user = toUser(row);
    return res.json({ user, token: signToken(user), refreshToken: signRefreshToken(user) });
});

router.get("/me", requireAuth, (req, res) => {
    const row = db.prepare("SELECT * FROM user WHERE id_user = ?").get(req.user.id_user);
    if (!row) {
        return res.status(404).json({ message: "Usuario no encontrado." });
    }
    return res.json(toUser(row));
});

export default router;
