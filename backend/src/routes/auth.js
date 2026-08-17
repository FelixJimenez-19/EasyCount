import bcrypt from "bcryptjs";
import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

const toUser = (row) => ({
    id_user: row.id_user,
    username: row.username,
    email: row.email,
    created_at: row.created_at,
});

router.post("/register", (req, res) => {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Usuario, correo y contraseña son obligatorios." });
    }
    if (String(password).length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres." });
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

    return res.status(201).json({ user, token: signToken(user) });
});

router.post("/login", (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ message: "Correo y contraseña son obligatorios." });
    }

    const row = db.prepare("SELECT * FROM user WHERE email = ?").get(email);
    if (!row || !bcrypt.compareSync(password, row.password)) {
        return res.status(401).json({ message: "Correo o contraseña incorrectos." });
    }

    const user = toUser(row);
    return res.json({ user, token: signToken(user) });
});

router.get("/me", requireAuth, (req, res) => {
    const row = db.prepare("SELECT * FROM user WHERE id_user = ?").get(req.user.id_user);
    if (!row) {
        return res.status(404).json({ message: "Usuario no encontrado." });
    }
    return res.json(toUser(row));
});

export default router;
