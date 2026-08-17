import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { db, seedDenominaciones } from "./db.js";
import authRouter from "./routes/auth.js";
import denominationsRouter from "./routes/denominations.js";
import transactionsRouter from "./routes/transactions.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "easycount-api", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/denominations", denominationsRouter);
app.use("/api/transactions", transactionsRouter);

app.use((_req, res) => {
    res.status(404).json({ message: "Ruta no encontrada." });
});

seedDenominaciones();

app.listen(config.port, config.HOST, () => {
    console.log(`EasyCount API escuchando en http://${config.HOST}:${config.port}`);
    console.log(`Health check: http://${config.HOST}:${config.port}/api/health`);
});

export { db };
