export type Tab = "conteo" | "reportes" | "catalogo" | "acerca";

export interface Denomination {
    id: number;
    label: string;
    valor: number;
    tipo: string;
    active: boolean;
}

export interface Transaction {
    id: string;
    date: Date;
    total: number;
    note: string;
    // breakdown: { label: string; value: number; qty: number; subtotal: number }[];
}
export interface TransactionDenomination {
    id_denomination: number;
    quantity: number;
    subtotal: number;
}
