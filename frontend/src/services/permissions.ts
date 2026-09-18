import { Linking } from "react-native";

/**
 * Estado normalizado de un permiso nativo, independiente de la plataforma.
 * Los cuatro estados que maneja la app:
 * - granted:            el usuario concedió el permiso.
 * - denied:             negado una vez; aún puede volver a preguntarse.
 * - denied_permanently: negado definitivamente; solo se recupera desde
 *                       los Ajustes del sistema.
 * - undetermined:       aún no se ha preguntado (o el SO no guarda decisión).
 */
export type PermissionState = "granted" | "denied" | "undetermined" | "denied_permanently";

interface PermissionLike {
    granted: boolean;
    status: string;
    canAskAgain: boolean;
}

export const mapPermissionResponse = (res: PermissionLike): PermissionState => {
    if (res.granted) return "granted";
    if (res.status === "undetermined") return "undetermined";
    return res.canAskAgain ? "denied" : "denied_permanently";
};

/** Acceso directo a los Ajustes del sistema (denegación permanente). */
export const openSystemSettings = (): Promise<void> => Linking.openSettings();
