import Constants from "expo-constants";
import { isDev, isProd } from "./env";
import { logger } from "../utils/logger";

const DEFAULT_PORT = 4000;
const PROD_DEFAULT_URL = "https://api.easycount.example/api";

const getDevHost = (): string => {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) return hostUri.split(":")[0];
    return "localhost";
};

const devUrl = `http://${getDevHost()}:${DEFAULT_PORT}/api`;

const rawUrl = process.env.EXPO_PUBLIC_API_URL ?? (isDev ? devUrl : PROD_DEFAULT_URL);

// Seguridad: en producción la API debe servirse por HTTPS.
if (isProd && !rawUrl.startsWith("https://")) {
    throw new Error("[EasyCount] La URL de la API en producción debe usar HTTPS.");
}

export const API_BASE_URL = rawUrl;

// Tiempos de espera explícitos del cliente HTTP.
export const API_TIMEOUT_MS = 10_000;
export const API_REFRESH_TIMEOUT_MS = 8_000;

// Reintentos (solo operaciones idempotentes).
export const RETRY_MAX_ATTEMPTS = 3;
export const RETRY_BASE_DELAY_MS = 500;

logger.info(`[EasyCount] API base URL: ${API_BASE_URL} (${isDev ? "dev" : "prod"})`);
