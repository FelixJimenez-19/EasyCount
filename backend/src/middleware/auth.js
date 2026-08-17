import jwt from "jsonwebtoken";
import { config } from "../config.js";

export const signToken = (user) =>
    jwt.sign({ id_user: user.id_user, username: user.username, email: user.email }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });

export const requireAuth = (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "No autorizado." });
    }

    try {
        const payload = jwt.verify(token, config.jwtSecret);
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ message: "Sesión inválida o expirada." });
    }
};
