import { BookOpen, Calculator, FileText, Info } from "lucide-react-native";
import { Tab } from "../types/models";

export const fmt = (n: number) => n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (d: Date) =>
    d.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });

// export const INITIAL_DENOMINATIONS: Denomination[] = [
//     { id: "b100", label: "$100.00", value: 100, type: "billete", active: true },
//     { id: "b50", label: "$50.00", value: 50, type: "billete", active: true },
//     { id: "b20", label: "$20.00", value: 20, type: "billete", active: true },
//     { id: "b10", label: "$10.00", value: 10, type: "billete", active: true },
//     { id: "b5", label: "$5.00", value: 5, type: "billete", active: true },
//     { id: "b1", label: "$1.00", value: 1, type: "billete", active: true },
//     { id: "c100", label: "$1.00", value: 1, type: "moneda", active: true },
//     { id: "c50", label: "$0.50", value: 0.5, type: "moneda", active: true },
//     { id: "c25", label: "$0.25", value: 0.25, type: "moneda", active: true },
//     { id: "c10", label: "$0.10", value: 0.1, type: "moneda", active: true },
//     { id: "c5", label: "$0.05", value: 0.05, type: "moneda", active: true },
//     { id: "c1", label: "$0.01", value: 0.01, type: "moneda", active: false },
// ];

export const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: "conteo", label: "Conteo", Icon: Calculator },
    { id: "reportes", label: "Reportes", Icon: FileText },
    { id: "catalogo", label: "Catálogo", Icon: BookOpen },
    { id: "acerca", label: "Acerca", Icon: Info },
];
