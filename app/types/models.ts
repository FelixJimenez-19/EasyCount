export type Tab = "conteo" | "reportes" | "catalogo" | "acerca";

export interface Denomination {
    id: string;
    label: string;
    value: number;
    type: "billete" | "moneda";
    active: boolean;
}

export interface Transaction {
    id: string;
    date: Date;
    total: number;
    note: string;
    // breakdown: { label: string; value: number; qty: number; subtotal: number }[];
}
