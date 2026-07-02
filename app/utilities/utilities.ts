export const fmt = (n: number) => n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (d: Date) =>
    d.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
