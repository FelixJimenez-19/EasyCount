export type Tab = "conteo" | "reportes" | "catalogo" | "acerca";

export interface Denomination {
    id: string;
    label: string;
    value: number;
    type: "billete" | "moneda";
    active: boolean;
}

export interface ArcheoEntry {
    id: string;
    date: Date;
    note: string;
    total: number;
    breakdown: { label: string; value: number; qty: number; subtotal: number }[];
}
