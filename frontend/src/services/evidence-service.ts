import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { newId } from "../utils/id";
import { logger } from "../utils/logger";
import { mapPermissionResponse, type PermissionState } from "./permissions";

export interface Evidence {
    /** URI local permanente (document/evidence/...) para mostrar la miniatura. */
    uri: string;
    /** Nombre del archivo, usado también por el servidor. */
    fileName: string;
    /** Contenido codificado para enviarlo al backend en la sincronización. */
    base64: string;
}

const evidenceDir = () => new Directory(Paths.document, "evidence");

const ensureDir = (): Directory => {
    const dir = evidenceDir();
    if (!dir.exists) {
        dir.create({ intermediates: true, idempotent: true });
    }
    return dir;
};

/** Copia la foto a almacenamiento persistente y obtiene su base64. */
const persistAsset = async (asset: ImagePicker.ImagePickerAsset): Promise<Evidence> => {
    const ext = asset.mimeType === "image/png" ? ".png" : ".jpg";
    const fileName = `${newId()}${ext}`;
    const destination = new File(ensureDir(), fileName);
    new File(asset.uri).copy(destination);
    const base64 = await destination.base64();
    return { uri: destination.uri, fileName, base64 };
};

const launchCamera = async (): Promise<Evidence | null> => {
    const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.5,
        cameraType: ImagePicker.CameraType.back,
    });
    if (result.canceled || !result.assets[0]) return null;
    return persistAsset(result.assets[0]);
};

export const EvidenceService = {
    async getCameraState(): Promise<PermissionState> {
        return mapPermissionResponse(await ImagePicker.getCameraPermissionsAsync());
    },

    async requestCamera(): Promise<PermissionState> {
        return mapPermissionResponse(await ImagePicker.requestCameraPermissionsAsync());
    },

    /** Captura con la cámara. Requiere permiso concedido previamente. */
    async capturePhoto(): Promise<Evidence | null> {
        try {
            return await launchCamera();
        } catch (error) {
            logger.warn("Error al capturar foto de evidencia:", error);
            return null;
        }
    },

    /**
     * Alternativa degradada: elegir de la galería mediante el selector de
     * fotos del sistema (Android 13+ / iOS 14+), que gestiona él mismo el
     * acceso la primera vez y no requiere permisos de la app.
     * Devuelve null si el usuario cancela o el selector falla.
     */
    async pickPhoto(): Promise<Evidence | null> {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                quality: 0.5,
            });
            if (result.canceled || !result.assets[0]) return null;
            return persistAsset(result.assets[0]);
        } catch (error) {
            logger.warn("Error al elegir foto de la galería:", error);
            return null;
        }
    },
};
