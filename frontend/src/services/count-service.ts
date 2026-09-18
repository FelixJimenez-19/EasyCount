import type { Denomination } from "@/src/models/denomination";
import type { Transaction, TransactionBreakdown } from "@/src/models/transaction";
import type { Evidence } from "./evidence-service";
import { DenominationRepository } from "@/src/data/repositories/denomination-repository";
import { TransactionRepository } from "@/src/data/repositories/transaction-repository";

/**
 * Fachada de la capa de estado: la UI solo conoce estos métodos y desconoce
 * si los datos provienen de la API, de SQLite o de la cola de salida.
 */
export const CountService = {
    getDenominaciones: (): Promise<Denomination[]> => DenominationRepository.list(),
    addDenominacion: (value: number, type: string, active: boolean): Promise<Denomination | null> =>
        DenominationRepository.create(value, type, active),
    saveDenominaciones: (updates: { id_denomination: number; active: boolean }[]): Promise<boolean> =>
        DenominationRepository.saveToggles(updates),
    saveTransaction: (
        total: number,
        observacion: string,
        desgloses: TransactionBreakdown[],
        evidence: Evidence | null = null
    ): Promise<boolean> => TransactionRepository.save(total, observacion, desgloses, evidence),
    getTransactions: (): Promise<Transaction[]> => TransactionRepository.list(),
    deleteTransaction: (id: string): Promise<boolean> => TransactionRepository.delete(id),
    getLastSyncAt: (): Promise<Date | null> => TransactionRepository.lastSyncAt(),
};
