import type { Denomination } from "../../models/denomination";
import { DenominationsRepo } from "../../db/repositories/denominations";
import { logger } from "../../utils/logger";

/**
 * Catálogo de denominaciones de Ecuador sembrado en el primer arranque.
 * En modo local no hay fuente remota: la tabla SQLite es la única verdad.
 */
const SEED: { value: number; type: string }[] = [
    { value: 0.01, type: "Moneda" },
    { value: 0.05, type: "Moneda" },
    { value: 0.1, type: "Moneda" },
    { value: 0.25, type: "Moneda" },
    { value: 0.5, type: "Moneda" },
    { value: 1.0, type: "Moneda" },
    { value: 1.0, type: "Billete" },
    { value: 5.0, type: "Billete" },
    { value: 10.0, type: "Billete" },
    { value: 20.0, type: "Billete" },
    { value: 50.0, type: "Billete" },
    { value: 100.0, type: "Billete" },
];

/**
 * Repositorio de denominaciones en modo local: siembra el catálogo la primera
 * vez y opera siempre contra SQLite.
 */
export const DenominationRepository = {
    async list(): Promise<Denomination[]> {
        try {
            await DenominationsRepo.seedIfEmpty(SEED);
            return await DenominationsRepo.getAll();
        } catch (error) {
            logger.warn("Falling back to local denominations:", error);
            return DenominationsRepo.getAll();
        }
    },

    async create(value: number, type: string, active: boolean): Promise<Denomination | null> {
        try {
            return await DenominationsRepo.createLocal(value, type, active);
        } catch (error) {
            logger.error("Error adding denomination:", error);
            return null;
        }
    },

    async saveToggles(updates: { id_denomination: number; active: boolean }[]): Promise<boolean> {
        for (const update of updates) {
            await DenominationsRepo.toggleLocal(update.id_denomination, update.active);
        }
        return true;
    },
};
