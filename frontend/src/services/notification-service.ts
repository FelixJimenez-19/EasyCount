import { isRunningInExpoGo } from "expo";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { logger } from "../utils/logger";
import { mapPermissionResponse, type PermissionState } from "./permissions";

type NotificationsModule = typeof import("expo-notifications");
type NotificationPermissionsStatus = import("expo-notifications").NotificationPermissionsStatus;

const CHANNEL_ID = "sync";
const ASKED_KEY = "easycount_notif_asked";

// En Expo Go (SDK 53+) expo-notifications no puede siquiera importarse sin
// imprimir avisos de push remoto no soportado. Como la app solo usa
// notificaciones locales, en Expo Go desactivamos el módulo por completo.
const notificationsAvailable = !isRunningInExpoGo();

let modulePromise: Promise<NotificationsModule> | null = null;
const loadNotifications = (): Promise<NotificationsModule> => {
    modulePromise ??= import("expo-notifications");
    return modulePromise;
};

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

const toState = (Notifications: NotificationsModule, res: NotificationPermissionsStatus): PermissionState => {
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
 * Las notificaciones de EasyCount son locales: se muestran cuando el usuario
 * guarda un cierre de caja, como confirmación del almacenamiento en el
 * dispositivo. No se envían notificaciones push remotas.
 */
export const NotificationService = {
    /** Crea el canal de Android (requisito previo al diálogo de permiso en Android 13+). */
    async init(): Promise<void> {
        if (!notificationsAvailable) return;
        const Notifications = await loadNotifications();
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: false,
                shouldSetBadge: false,
            }),
        });
        if (Platform.OS !== "android") return;
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: "Cierres guardados",
            description: "Avisos cuando guardas un cierre de caja.",
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    },

    async getPermissionState(): Promise<PermissionState> {
        if (!notificationsAvailable) return "granted";
        const Notifications = await loadNotifications();
        const res = await Notifications.getPermissionsAsync();
        const state = toState(Notifications, res);
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
        if (!notificationsAvailable) return "granted";
        await markAsked();
        await this.init();
        const Notifications = await loadNotifications();
        const res = await Notifications.requestPermissionsAsync({
            ios: { allowAlert: true, allowBadge: false, allowSound: false },
        });
        return toState(Notifications, res);
    },

    /** Avisa que un cierre se guardó localmente. Sin permiso concedido no hace nada. */
    async notifySaved(count = 1): Promise<void> {
        if (!notificationsAvailable) return;
        try {
            const state = await this.getPermissionState();
            if (state !== "granted") return;
            const Notifications = await loadNotifications();
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Cierre guardado",
                    body: count === 1 ? "Tu cierre se guardó correctamente." : `${count} cierres se guardaron correctamente.`,
                },
                trigger: null,
            });
        } catch (error) {
            logger.warn("Error mostrando notificación de guardado:", error);
        }
    },
};
