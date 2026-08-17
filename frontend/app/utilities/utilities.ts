import { BookOpen, Calculator, FileText, Info } from "lucide-react-native";
import { Tab, Transaction, TransactionRow } from "../types/models";

export const fmt = (n: number) => n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Agrupa las filas planas del INNER JOIN (una fila por denominación) en Transacciones con su desglose
 */
export const mapTransactionRows = (rows: TransactionRow[]): Transaction[] => {
    const transactions = new Map<number, Transaction>();

    for (const row of rows) {
        if (!transactions.has(row.id_transaction)) {
            transactions.set(row.id_transaction, {
                id_transaction: String(row.id_transaction),
                date: new Date(row.date),
                total: row.total_general,
                observation: row.observation,
                breakdown: [],
            });
        }
        transactions.get(row.id_transaction)!.breakdown.push({
            label: `$${fmt(row.value)}`,
            value: row.value,
            qty: row.quantity,
            subtotal: row.subtotal,
        });
    }

    return Array.from(transactions.values());
};

export const fmtDate = (d: Date) =>
    d.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });

export const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: "conteo", label: "Conteo", Icon: Calculator },
    { id: "reportes", label: "Reportes", Icon: FileText },
    { id: "catalogo", label: "Catálogo", Icon: BookOpen },
    { id: "acerca", label: "Acerca", Icon: Info },
];
