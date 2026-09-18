import { api } from "../../services/http/client";
import { parseTransactionRows, type TransactionRow } from "../../models/transaction";

export interface CreateTransactionPayload {
    clientId: string;
    total: number;
    observation: string;
    breakdown: { id_denomination: number; quantity: number; subtotal: number }[];
    evidence?: { fileName: string; base64: string } | null;
}

export const TransactionRemote = {
    getAll: async (): Promise<TransactionRow[]> =>
        parseTransactionRows(await api.get<unknown>("/transactions")),
    create: (payload: CreateTransactionPayload) =>
        api.post<{ id_transaction: number }>("/transactions", payload),
    remove: (clientId: string) =>
        api.delete<{ deleted: boolean }>(`/transactions/${encodeURIComponent(clientId)}`),
};
