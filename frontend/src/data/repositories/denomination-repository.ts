import type { Denomination } from "../../models/denomination";
import { DenominationRemote } from "../remote/denomination-remote";
import { DenominationsRepo } from "../../db/repositories/denominations";
import { OperationsRepo } from "../../db/repositories/operations";
import { SyncEngine } from "../../services/sync-engine";
import { newId } from "../../utils/id";
import { logger } from "../../utils/logger";

/**
 * Repositorio de denominaciones: oculta el origen de los datos a la capa de
 * estado. Combina fuente remota (API) + fuente local (SQLite) + cola de salida.
 */
export const DenominationRepository = {
    async list(): Promise<Denomination[]> {
        try {
            const data = await DenominationRemote.getAll();
            await DenominationsRepo.replaceAll(data);
            return data;
        } catch (error) {
            logger.warn("Falling back to local denominations:", error);
            return DenominationsRepo.getAll();
        }
    },

    async create(value: number, type: string, active: boolean): Promise<Denomination | null> {
        try {
            const created = await DenominationRemote.create(value, type, active);
            await DenominationsRepo.replaceAll(await DenominationRemote.getAll());
            return created;
        } catch (error) {
            logger.error("Error adding denomination:", error);
            return null;
        }
    },

    async toggle(id: number, active: boolean): Promise<boolean> {
        await DenominationsRepo.toggleLocal(id, active);
        await OperationsRepo.enqueue("toggle_denomination", newId(), {
            id_denomination: id,
            active,
            updatedAt: new Date().toISOString(),
        });
        SyncEngine.kick();
        return true;
    },
};
