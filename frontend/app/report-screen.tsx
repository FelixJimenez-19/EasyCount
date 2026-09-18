import { CountService } from "@/src/services/count-service";
import { API_BASE_URL } from "@/src/config/api";
import { useNetworkState } from "expo-network";
import { CalendarDays, ChevronDown, ChevronUp, Search, SlidersHorizontal, Trash2, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Button from "./components/buttons";
import { useToast } from "./components/toast";
import { Transaction } from "./types/models";
import { fmt, fmtDate } from "./utilities/utilities";

const relativeTime = (d: Date): string => {
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 60) return `hace ${sec} seg`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `hace ${min} min`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `hace ${hrs} h`;
    return `hace ${Math.floor(hrs / 24)} d`;
};

// La evidencia puede ser un archivo local (aún sin sincronizar) o una ruta del servidor.
const evidenceUrl = (evidence: string): string => {
    if (evidence.startsWith("file://")) return evidence;
    if (evidence.startsWith("/")) return `${API_BASE_URL.replace(/\/api$/, "")}${evidence}`;
    return evidence;
};

// Interpreta "AAAA-MM-DD" como el inicio del día en hora local.
const startOfDay = (value: string): number | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d, 0, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const endOfDay = (value: string): number | null => {
    const start = startOfDay(value);
    return start === null ? null : start + 24 * 60 * 60 * 1000 - 1;
};

const isoDay = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const PRESETS: { label: string; days: number | null }[] = [
    { label: "Hoy", days: 1 },
    { label: "7 días", days: 7 },
    { label: "30 días", days: 30 },
    { label: "Todo", days: null },
];

export default function ReportScreen() {
    const { show } = useToast();
    const [expanded, setExpanded] = useState<string | null>(null);
    const [history, setHistory] = useState<Transaction[]>([]);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [query, setQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const network = useNetworkState();
    const offline = network.isConnected === false;

    const cargarHistorial = useCallback(async () => {
        const txns = await CountService.getTransactions();
        setHistory(txns);
        setLastSync(await CountService.getLastSyncAt());
    }, []);

    useEffect(() => {
        cargarHistorial();
    }, [cargarHistorial]);

    const fromMs = startOfDay(dateFrom);
    const toMs = endOfDay(dateTo);
    const hasDateFilter = Boolean(dateFrom || dateTo);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return history.filter((entry) => {
            if (q) {
                const haystack = `${entry.observation} ${fmt(entry.total)} ${fmtDate(entry.date)}`.toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            const t = entry.date.getTime();
            if (fromMs !== null && t < fromMs) return false;
            if (toMs !== null && t > toMs) return false;
            return true;
        });
    }, [history, query, fromMs, toMs]);

    const applyPreset = (days: number | null) => {
        if (days === null) {
            setDateFrom("");
            setDateTo("");
            return;
        }
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - (days - 1));
        setDateFrom(isoDay(start));
        setDateTo(isoDay(today));
    };

    const clearFilters = () => {
        setDateFrom("");
        setDateTo("");
    };

    const eliminar = useCallback(
        async (entry: Transaction) => {
            const ok = await CountService.deleteTransaction(entry.id_transaction);
            if (!ok) {
                show("Error", "No se pudo eliminar el registro.", { variant: "error" });
                return;
            }
            setHistory((prev) => prev.filter((t) => t.id_transaction !== entry.id_transaction));
            setExpanded((prev) => (prev === entry.id_transaction ? null : prev));
            show("Registro eliminado", "El cierre se eliminó correctamente.", { variant: "success" });
        },
        [show]
    );

    const confirmDelete = useCallback(
        (entry: Transaction) => {
            Alert.alert("Eliminar registro", "¿Seguro que deseas eliminar este cierre? Esta acción no se puede deshacer.", [
                { text: "Cancelar", style: "cancel" },
                { text: "Eliminar", style: "destructive", onPress: () => void eliminar(entry) },
            ]);
        },
        [eliminar]
    );

    return (
        <View className="flex-1 px-4 w-full">
            <View className="pt-6 pb-4">
                <Text className="text-xl font-semibold text-foreground">Historial de Registros</Text>
                <Text className="text-xs text-muted-foreground mt-1">
                    {filtered.length === history.length
                        ? `${history.length} registros guardados`
                        : `${filtered.length} de ${history.length} registros`}
                </Text>

                <View className="mt-3 flex-row items-center gap-x-2">
                    <View className="flex-1 min-w-0">
                        {offline ? (
                            <View className="self-start flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
                                <View className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <Text className="text-[11px] font-medium text-amber-400" numberOfLines={1}>
                                    Sin conexión · datos locales
                                </Text>
                            </View>
                        ) : lastSync ? (
                            <View className="self-start flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                                <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <Text className="text-[11px] font-medium text-primary" numberOfLines={1}>
                                    Actualizado {relativeTime(lastSync)}
                                </Text>
                            </View>
                        ) : (
                            <View className="self-start flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/40">
                                <View className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                <Text className="text-[11px] font-medium text-muted-foreground" numberOfLines={1}>
                                    Sin datos sincronizados aún
                                </Text>
                            </View>
                        )}
                    </View>

                    <View className="flex-row items-center bg-card border border-border rounded-xl px-2.5 h-9 w-36 gap-x-2">
                        <Search size={14} color="#94a3b8" />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Buscar..."
                            placeholderTextColor="#64748b"
                            returnKeyType="search"
                            className="flex-1 text-foreground text-xs py-0"
                        />
                        {query ? (
                            <Pressable onPress={() => setQuery("")} hitSlop={8} className="active:opacity-60">
                                <X size={13} color="#94a3b8" />
                            </Pressable>
                        ) : null}
                    </View>

                    <Pressable
                        onPress={() => setShowFilters((v) => !v)}
                        hitSlop={4}
                        className={`w-9 h-9 items-center justify-center rounded-xl border active:opacity-70 ${
                            showFilters || hasDateFilter ? "bg-primary/15 border-primary/30" : "bg-card border-border"
                        }`}
                    >
                        <SlidersHorizontal size={16} color={showFilters || hasDateFilter ? "#4ade80" : "#94a3b8"} />
                    </Pressable>
                </View>

                {showFilters && (
                    <View className="mt-3 bg-card border border-border rounded-2xl p-3">
                        <View className="flex-row items-center gap-2 mb-3">
                            <CalendarDays size={14} color="#94a3b8" />
                            <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Rango de fechas</Text>
                        </View>

                        <View className="flex-row items-center gap-2">
                            <TextInput
                                value={dateFrom}
                                onChangeText={setDateFrom}
                                placeholder="Desde AAAA-MM-DD"
                                placeholderTextColor="#64748b"
                                maxLength={10}
                                autoCapitalize="none"
                                autoCorrect={false}
                                className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground"
                            />
                            <Text className="text-muted-foreground text-xs">—</Text>
                            <TextInput
                                value={dateTo}
                                onChangeText={setDateTo}
                                placeholder="Hasta AAAA-MM-DD"
                                placeholderTextColor="#64748b"
                                maxLength={10}
                                autoCapitalize="none"
                                autoCorrect={false}
                                className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground"
                            />
                        </View>

                        <View className="flex-row flex-wrap gap-2 mt-3">
                            {PRESETS.map((preset) => (
                                <Pressable
                                    key={preset.label}
                                    onPress={() => applyPreset(preset.days)}
                                    className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border active:opacity-70"
                                >
                                    <Text className="text-[11px] font-medium text-muted-foreground">{preset.label}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <View className="flex-row gap-2 mt-3">
                            <Button label="Limpiar" variant="outline" size="md" className="flex-1" onPress={clearFilters} />
                            <Button label="Listo" variant="primary" size="md" className="flex-1" onPress={() => setShowFilters(false)} />
                        </View>
                    </View>
                )}
            </View>

            <ScrollView className="w-full" contentContainerClassName="gap-y-3 pb-10" showsVerticalScrollIndicator={false}>
                {filtered.length === 0 ? (
                    <View className="items-center justify-center py-16 px-6">
                        <Search size={22} color="#64748b" />
                        <Text className="text-sm font-medium text-foreground mt-3">
                            {history.length === 0 ? "Aún no hay registros" : "Sin resultados"}
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-1 text-center">
                            {history.length === 0 ? "Tus cierres de caja aparecerán aquí." : "Prueba con otra búsqueda o ajusta el rango de fechas."}
                        </Text>
                    </View>
                ) : (
                    filtered.map((entry) => (
                        <View key={entry.id_transaction} className="bg-card rounded-2xl shadow-sm w-full shadow-black/20 overflow-hidden">
                            <Pressable
                                className="w-full p-4 flex-row items-center justify-between"
                                onPress={() => setExpanded(expanded === entry.id_transaction ? null : entry.id_transaction)}
                            >
                                <View className="flex-1 min-w-0 pr-2">
                                    <Text className="text-[11px] text-muted-foreground mb-1">{fmtDate(entry.date)}</Text>
                                    <Text className="text-sm font-medium text-foreground truncate">{entry.observation}</Text>
                                </View>
                                <View className="flex-row items-center gap-x-2 shrink-0">
                                    {entry.evidence && (
                                        <Image
                                            source={{ uri: evidenceUrl(entry.evidence) }}
                                            className="w-10 h-10 rounded-lg bg-background"
                                            resizeMode="cover"
                                        />
                                    )}
                                    <Text className="text-base font-bold text-primary font-mono">${fmt(entry.total)}</Text>
                                    {expanded === entry.id_transaction ? (
                                        <ChevronUp size={16} className="text-muted-foreground" color="#10b981" />
                                    ) : (
                                        <ChevronDown size={16} className="text-muted-foreground" color="#fff" />
                                    )}
                                    <Pressable
                                        onPress={() => confirmDelete(entry)}
                                        hitSlop={6}
                                        className="w-7 h-7 items-center justify-center rounded-lg bg-destructive/10 active:opacity-70"
                                    >
                                        <Trash2 size={13} color="#f87171" />
                                    </Pressable>
                                </View>
                            </Pressable>

                            {expanded === entry.id_transaction && (
                                <View className="border-t border-border px-4 py-3 gap-y-2">
                                    <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Desglose</Text>
                                    {entry.breakdown.map((item, i) => (
                                        <View key={i} className="flex-row items-center justify-between text-sm py-1">
                                            <Text className="text-muted-foreground font-mono">{item.label}</Text>
                                            <View className="flex-row items-center gap-x-3">
                                                <Text className="text-muted-foreground">×{item.qty}</Text>
                                                <Text className="text-foreground font-semibold font-mono w-20 text-right">${fmt(item.subtotal)}</Text>
                                            </View>
                                        </View>
                                    ))}
                                    {entry.evidence && (
                                        <View className="pt-2 mt-1 border-t border-border">
                                            <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
                                                Respaldo fotográfico
                                            </Text>
                                            <Image
                                                source={{ uri: evidenceUrl(entry.evidence) }}
                                                className="w-full h-44 rounded-xl bg-background"
                                                resizeMode="cover"
                                            />
                                        </View>
                                    )}
                                    <View className="pt-2 mt-2 border-t border-border flex-row justify-between items-center">
                                        <Text className="text-sm font-medium text-muted-foreground">Total</Text>
                                        <Text className="text-base font-bold text-primary font-mono">${fmt(entry.total)}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
