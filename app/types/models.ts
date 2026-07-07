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
    breakdown: { label: string; value: number; qty: number; subtotal: number }[];
}
export interface TransactionDenomination {
    id_denomination: number;
    quantity: number;
    subtotal: number;
}

/**
 * Fila cruda resultante del INNER JOIN de transaccion + transaccion_denominacion + denominacion
 */
export interface TransactionRow {
    id_transaccion: number;
    fecha: string;
    total_general: number;
    observacion: string;
    cantidad: number;
    subtotal: number;
    valor: number;
    tipo: string;
}
