export type DomainErrorKind = "network" | "timeout" | "auth" | "server";

/**
 * Error de dominio: traduce las cuatro familias de fallo de red a un único
 * tipo que la capa de estado puede mostrar sin conocer el origen.
 */
export class DomainError extends Error {
    readonly kind: DomainErrorKind;
    readonly status?: number;

    constructor(kind: DomainErrorKind, message: string, status?: number, cause?: unknown) {
        super(message);
        this.name = "DomainError";
        this.kind = kind;
        this.status = status;
        if (cause !== undefined) {
            (this as unknown as { cause?: unknown }).cause = cause;
        }
    }
}

export const isDomainError = (error: unknown): error is DomainError =>
    error instanceof DomainError;

export const networkError = (cause?: unknown) =>
    new DomainError("network", "Sin conexión a internet. Revisa tu red e inténtalo de nuevo.", undefined, cause);

export const timeoutError = (cause?: unknown) =>
    new DomainError("timeout", "El servidor tardó demasiado en responder. Inténtalo de nuevo.", undefined, cause);

export const authError = (message = "Tu sesión ha expirado. Inicia sesión de nuevo.", cause?: unknown) =>
    new DomainError("auth", message, 401, cause);

export const serverError = (message: string, status?: number, cause?: unknown) =>
    new DomainError("server", message, status, cause);

/** Mensaje amigable listo para mostrar en la UI. */
export const toUserMessage = (error: unknown, fallback = "Ocurrió un error inesperado."): string => {
    if (isDomainError(error)) return error.message;
    return fallback;
};
