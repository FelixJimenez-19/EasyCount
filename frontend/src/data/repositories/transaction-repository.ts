import type { Transaction, TransactionBreakdown } from "../../models/transaction";
import type { Evidence } from "../../services/evidence-service";
import { TransactionsRepo } from "../../db/repositories/transactions";
import { newId } from "../../utils/id";
import { logger } from "../../utils/logger";

/**
 * Repositorio de transacciones en modo local: escribe y lee exclusivamente
 * de SQLite. La foto de respaldo se guarda como URI local.
 */
export const TransactionRepository = {
    async save(
        total: number,
        observation: string,
        breakdown: TransactionBreakdown[],
        evidence: Evidence | null = null
    ): Promise<boolean> {
        try {
            const clientId = newId();
            const now = new Date().toISOString();
            const safeObservation = observation || "Sin observación";

            await TransactionsRepo.insertLocal({
                clientId,
                date: now,
                total,
                observation: safeObservation,
                evidenceUri: evidence?.uri ?? null,
                breakdown,
            });

            return true;
        } catch (error) {
            logger.error("Error saving transaction locally:", error);
            return false;
        }
    },

    async delete(localId: string): Promise<boolean> {
        try {
            const id = Number(localId);
            if (!Number.isInteger(id)) return false;

            const row = await TransactionsRepo.getLocal(id);
            if (!row) return false;

            await TransactionsRepo.deleteLocal(id);
            return true;
        } catch (error) {
            logger.error("Error deleting transaction locally:", error);
            return false;
        }
    },

    async list(): Promise<Transaction[]> {
        try {
            return await TransactionsRepo.getAll();
        } catch (error) {
            logger.warn("Error reading local transactions:", error);
            return [];
        }
    },
};
