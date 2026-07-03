import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ArcheoEntry } from "./types/models";
import { fmt, fmtDate } from "./utilities/utilities";

export default function ReportScreen() {
    const [expanded, setExpanded] = useState<string | null>(null);
    const SAMPLE_HISTORY: ArcheoEntry[] = [
        {
            id: "h1",
            date: new Date(2025, 5, 28, 8, 15),
            note: "Apertura de caja matutina",
            total: 1245.75,
            breakdown: [
                { label: "$100.00", value: 100, qty: 10, subtotal: 1000 },
                { label: "$20.00", value: 20, qty: 8, subtotal: 160 },
                { label: "$5.00", value: 5, qty: 7, subtotal: 35 },
                { label: "$0.50", value: 0.5, qty: 3, subtotal: 1.5 },
                { label: "$0.25", value: 0.25, qty: 5, subtotal: 1.25 },
            ],
        },
        {
            id: "h2",
            date: new Date(2025, 5, 27, 18, 0),
            note: "Cierre de caja tarde",
            total: 892.0,
            breakdown: [
                { label: "$100.00", value: 100, qty: 7, subtotal: 700 },
                { label: "$50.00", value: 50, qty: 3, subtotal: 150 },
                { label: "$20.00", value: 20, qty: 2, subtotal: 40 },
                { label: "$1.00", value: 1, qty: 2, subtotal: 2 },
            ],
        },
        {
            id: "h3",
            date: new Date(2025, 5, 26, 12, 30),
            note: "Inventario de mediodía",
            total: 3480.5,
            breakdown: [
                { label: "$100.00", value: 100, qty: 30, subtotal: 3000 },
                { label: "$50.00", value: 50, qty: 8, subtotal: 400 },
                { label: "$20.00", value: 20, qty: 4, subtotal: 80 },
                { label: "$0.50", value: 0.5, qty: 1, subtotal: 0.5 },
            ],
        },
    ];
    return (
        <View className="flex-1 w-full">
            <View className="pb-5">
                <Text className="text-xl font-semibold text-foreground">Historial de Registros</Text>
                <Text className="text-xs text-muted-foreground mt-1">{SAMPLE_HISTORY.length} registros guardados</Text>
            </View>

            <ScrollView className="w-full" contentContainerClassName="gap-y-3 pb-10" showsVerticalScrollIndicator={false}>
                {SAMPLE_HISTORY.map((entry) => (
                    <View key={entry.id} className="bg-card rounded-2xl shadow-sm w-full shadow-black/20 overflow-hidden">
                        <Pressable
                            className="w-full p-4 flex-row items-center justify-between"
                            onPress={() => setExpanded(expanded === entry.id ? null : entry.id)}
                        >
                            <View className="flex-1 min-w-0 pr-2">
                                <Text className="text-[11px] text-muted-foreground mb-1">{fmtDate(entry.date)}</Text>
                                <Text className="text-sm font-medium text-foreground truncate">{entry.note}</Text>
                            </View>
                            <View className="flex-row items-center gap-x-2 shrink-0">
                                <Text className="text-base font-bold text-primary font-mono">${fmt(entry.total)}</Text>
                                {expanded === entry.id ? (
                                    <ChevronUp size={16} className="text-muted-foreground" />
                                ) : (
                                    <ChevronDown size={16} className="text-muted-foreground" />
                                )}
                            </View>
                        </Pressable>

                        {expanded === entry.id && (
                            <View className="border-t border-border px-4 py-3 gap-y-2">
                                <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Desglose</Text>
                                {entry.breakdown.map((item, i) => (
                                    <View key={i} className="flex-row items-center justify-between text-sm py-1">
                                        {" "}
                                        <Text className="text-muted-foreground font-mono">{item.label}</Text>
                                        <View className="flex-row items-center gap-x-3">
                                            <Text className="text-muted-foreground">×{item.qty}</Text>
                                            <Text className="text-foreground font-semibold font-mono w-20 text-right">${fmt(item.subtotal)}</Text>
                                        </View>
                                    </View>
                                ))}
                                <View className="pt-2 mt-2 border-t border-border flex-row justify-between items-center">
                                    <Text className="text-sm font-medium text-muted-foreground">Total</Text>
                                    <Text className="text-base font-bold text-primary font-mono">${fmt(entry.total)}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
