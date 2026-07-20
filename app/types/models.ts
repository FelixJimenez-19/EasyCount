export type Tab = "conteo" | "reportes" | "catalogo" | "acerca";

export interface User {
    id_user: number;
    username: string;
    email: string;
    created_at: string;
}

export interface Denomination {
    id_denomination: number;
    label: string;
    value: number;
    type: string;
    active: boolean;
}

export interface Transaction {
    id_transaction: string;
    date: Date;
    total: number;
    observation: string;
    breakdown: { label: string; value: number; qty: number; subtotal: number }[];
}
export interface TransactionDenomination {
    id_denomination: number;
    quantity: number;
    subtotal: number;
}

export interface TransactionRow {
    id_transaction: number;
    date: string;
    total_general: number;
    observation: string;
    quantity: number;
    subtotal: number;
    value: number;
    type: string;
}
