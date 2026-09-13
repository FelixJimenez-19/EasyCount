import { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig, create, isAxiosError } from "axios";
import {
    API_BASE_URL,
    API_REFRESH_TIMEOUT_MS,
    API_TIMEOUT_MS,
    RETRY_BASE_DELAY_MS,
    RETRY_MAX_ATTEMPTS,
} from "../../config/api";
import { AuthStore } from "../auth-store";
import { DomainError, authError, networkError, serverError, timeoutError } from "../../domain/errors";

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

const IDEMPOTENT_METHODS = new Set(["get", "head", "options", "put", "delete"]);

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Única instancia del cliente HTTP para toda la aplicación.
 * Justificación de axios: interceptores de request/response nativos, timeout
 * por instancia, cancelación y normalización de errores de red entre plataformas.
 */
export const httpClient = create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT_MS,
    headers: { "Content-Type": "application/json" },
});

// Instancia cruda para el refresh: sin interceptores, para evitar bucles.
const refreshClient = create({
    baseURL: API_BASE_URL,
    timeout: API_REFRESH_TIMEOUT_MS,
});

// ---------------------------------------------------------------------------
// Interceptor de autenticación: inyecta el token leído del almacenamiento
// cifrado (SecureStore) en cada petición.
// ---------------------------------------------------------------------------
httpClient.interceptors.request.use(async (config) => {
    const token = AuthStore.getToken();
    if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
});

// ---------------------------------------------------------------------------
// Renovación del token: single-flight (una sola petición de refresh a la vez).
// ---------------------------------------------------------------------------
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const currentRefresh = AuthStore.getRefreshToken();
            if (!currentRefresh) {
                await AuthStore.clear();
                AuthStore.notifySessionExpired();
                throw authError("Tu sesión ha expirado. Inicia sesión de nuevo.");
            }
            try {
                const { data } = await refreshClient.post<{ token: string; refreshToken: string }>(
                    "/auth/refresh",
                    { refreshToken: currentRefresh },
                );
                await AuthStore.setTokens(data.token, data.refreshToken);
                return data.token;
            } catch (error) {
                const mapped = mapToDomainError(error);
                if (mapped.kind === "auth") {
                    await AuthStore.clear();
                    AuthStore.notifySessionExpired();
                }
                throw mapped;
            }
        })().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

// ---------------------------------------------------------------------------
// Traducción de las cuatro familias de fallo a errores del dominio.
// ---------------------------------------------------------------------------
function mapToDomainError(error: unknown): DomainError {
    if (isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as { message?: string; errors?: Record<string, string> } | undefined;
        const fieldMessage = data?.errors ? Object.values(data.errors).join(" ") : undefined;

        if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
            return timeoutError(error);
        }
        if (!error.response) {
            return networkError(error);
        }
        if (status === 401 || status === 403) {
            return authError(fieldMessage ?? data?.message ?? "Tu sesión ha expirado. Inicia sesión de nuevo.", error);
        }
        return serverError(fieldMessage ?? data?.message ?? `Error ${status}`, status, error);
    }
    return serverError("Error inesperado del servidor.", undefined, error);
}

function shouldRetry(config: RetriableConfig, error: AxiosError): boolean {
    const method = (config.method ?? "get").toLowerCase();
    if (!IDEMPOTENT_METHODS.has(method)) return false;
    // Solo se reintenta ante fallos de red/timeout (sin respuesta) o errores 5xx.
    if (error.response && error.response.status < 500) return false;
    return true;
}

// ---------------------------------------------------------------------------
// Interceptor de respuesta: renovación ante 401 (con anti-bucle) y reintentos
// solo para operaciones idempotentes.
// ---------------------------------------------------------------------------
httpClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as RetriableConfig | undefined;

        // Renovación ante 401: se reintenta la petición una única vez (_retry).
        if (error.response?.status === 401 && original && !original._retry) {
            original._retry = true;
            try {
                const newToken = await refreshAccessToken();
                original.headers.set("Authorization", `Bearer ${newToken}`);
                return httpClient(original);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }

        // Reintentos idempotentes con backoff exponencial.
        if (original && shouldRetry(original, error)) {
            const count = (original._retryCount ?? 0) + 1;
            if (count < RETRY_MAX_ATTEMPTS) {
                original._retryCount = count;
                await delay(RETRY_BASE_DELAY_MS * Math.pow(2, count - 1));
                return httpClient(original);
            }
        }

        return Promise.reject(mapToDomainError(error));
    },
);

export const api = {
    get: <T>(path: string, config?: AxiosRequestConfig) =>
        httpClient.get<T>(path, config).then((r) => r.data),
    post: <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
        httpClient.post<T>(path, body, config).then((r) => r.data),
    patch: <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
        httpClient.patch<T>(path, body, config).then((r) => r.data),
    delete: <T>(path: string, config?: AxiosRequestConfig) =>
        httpClient.delete<T>(path, config).then((r) => r.data),
};

export { isDomainError } from "../../domain/errors";
