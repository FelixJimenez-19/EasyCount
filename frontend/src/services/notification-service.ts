import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { logger } from "../utils/logger";
import { mapPermissionResponse, type PermissionState } from "./permissions";

const CHANNEL_ID = "sync";
const ASKED_KEY = "easycount_notif_asked";

let askedThisSession = false;

const hasAskedBefore = async (): Promise<boolean> => {
    if (askedThisSession) return true;
    try {
        return (await SecureStore.getItemAsync(ASKED_KEY)) === "1";
    } catch {
        return false;
    }
};

const markAsked = async (): Promise<void> => {
    askedThisSession = true;
    try {
        await SecureStore.setItemAsync(ASKED_KEY, "1");
    } catch (error) {
        logger.warn("No se pudo registrar la solicitud de notificaciones:", error);
    }
};

const toState = (res: Notifications.NotificationPermissionsStatus): PermissionState => {
    // iOS expone estados más finos que Android.
    if (res.ios) {
        const s = res.ios.status;
        if (
            s === Notifications.IosAuthorizationStatus.AUTHORIZED ||
            s === Notifications.IosAuthorizationStatus.PROVISIONAL ||
            s === Notifications.IosAuthorizationStatus.EPHEMERAL
        ) {
            return "granted";
        }
        if (s === Notifications.IosAuthorizationStatus.NOT_DETERMINED) return "undetermined";
        return res.canAskAgain ? "denied" : "denied_permanently";
    }
    return mapPermissionResponse(res);
};

/**
 * Las notificaciones de EasyCount son locales: se muestran cuando la cola
 * de salida termina de enviar los cierres al servidor (feedback del modelo
 * offline-first). No se envían notificaciones push remotas.
 */
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export const NotificationService = {
    /** Crea el canal de Android (requisito previo al diálogo de permiso en Android 13+). */
    async init(): Promise<void> {
        if (Platform.OS !== "android") return;
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: "Sincronización",
            description: "Avisos cuando tus cierres de caja se sincronizan con el servidor.",
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    },

    async getPermissionState(): Promise<PermissionState> {
        const res = await Notifications.getPermissionsAsync();
        const state = toState(res);
        // Workaround expo/expo#29979: en Android 13+ expo-notifications
        // reporta "denied" cuando las notificaciones están desactivadas por
        // defecto y el permiso todavía no se ha solicitado nunca. Si aún no
        // hemos preguntado, lo tratamos como "undetermined" para mostrar la
        // explicación previa en lugar del flujo de denegado.
        if (Platform.OS === "android" && state !== "granted" && !(await hasAskedBefore())) {
            return "undetermined";
        }
        return state;
    },

    /** Solicita el permiso al usuario (el diálogo del sistema). */
    async requestPermission(): Promise<PermissionState> {
        await markAsked();
        await this.init();
        const res = await Notifications.requestPermissionsAsync({
            ios: { allowAlert: true, allowBadge: false, allowSound: false },
        });
        return toState(res);
    },

    /** Avisa que la sincronización terminó. Sin permiso concedido no hace nada. */
    async notifySyncComplete(count: number): Promise<void> {
        try {
            const state = await this.getPermissionState();
            if (state !== "granted") return;
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Sincronización completada",
                    body: count === 1 ? "Tu cierre se guardó correctamente." : `${count} cierres se guardaron correctamente.`,
                },
                trigger: null,
            });
        } catch (error) {
            logger.warn("Error mostrando notificación de sincronización:", error);
        }
    },
};
