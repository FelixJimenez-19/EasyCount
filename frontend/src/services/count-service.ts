import { Denomination, TransactionDenomination, TransactionRow } from "@/app/types/models";
import { api } from "./api-client";

export const CountService = {
    async getDenominaciones(): Promise<Denomination[]> {
        try {
            return await api.get<Denomination[]>("/denominations");
        } catch (error) {
            console.error("Error to get Denominations:", error);
            return [];
        }
    },

    async addDenominacion(value: number, type: string, active: boolean): Promise<Denomination | null> {
        try {
            return await api.post<Denomination>("/denominations", { value, type, active });
        } catch (error) {
            console.error("Error to add Denomination:", error);
            return null;
        }
    },

    async toggleDenominacion(id: number, active: boolean): Promise<boolean> {
        try {
            await api.patch<Denomination>(`/denominations/${id}`, { active });
            return true;
        } catch (error) {
            console.error("Error to update Denomination status:", error);
            return false;
        }
    },

    async saveTransaction(montoTotal: number, observacion: string, desgloses: TransactionDenomination[]): Promise<boolean> {
        try {
            await api.post("/transactions", { total: montoTotal, observation: observacion, breakdown: desgloses });
            return true;
        } catch (error) {
            console.error("Error to save Transaction:", error);
            return false;
        }
    },

    async getTransaction(): Promise<TransactionRow[]> {
        try {
            return await api.get<TransactionRow[]>("/transactions");
        } catch (error) {
            console.error("Error to get Transaction:", error);
            return [];
        }
    },
};
