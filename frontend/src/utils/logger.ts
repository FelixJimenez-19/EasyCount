import { isDev } from "../config/env";

/**
 * Logger que desactiva el registro detallado en producción.
 * En desarrollo imprime para facilitar el diagnóstico; en producción es silencioso.
 */
export const logger = {
    info(...args: unknown[]): void {
        if (isDev) console.log(...args);
    },
    warn(...args: unknown[]): void {
        if (isDev) console.warn(...args);
    },
    error(...args: unknown[]): void {
        if (isDev) console.error(...args);
    },
};
