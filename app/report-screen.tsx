import { CountService } from "@/src/services/count-service";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Transaction } from "./types/models";
import { fmt, fmtDate, mapTransactionRows } from "./utilities/utilities";

export default function ReportScreen() {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [history, setHistory] = useState<Transaction[]>([]);

    const cargarHistorial = useCallback(() => {
        const rows = CountService.getTransaction();
        setHistory(mapTransactionRows(rows));
    }, []);

    useEffect(() => {
        cargarHistorial();
    }, [cargarHistorial]);

    return (
        <View className="flex-1 px-4 w-full">
            <View className="pb-5">
                <Text className="text-xl font-semibold text-foreground">Historial de Registros</Text>
                <Text className="text-xs text-muted-foreground mt-1">{history.length} registros guardados</Text>
            </View>

            <ScrollView className="w-full" contentContainerClassName="gap-y-3 pb-10" showsVerticalScrollIndicator={false}>
                {history.map((entry) => (
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
                                    <ChevronUp size={16} className="text-muted-foreground" color="#10b981" />
                                ) : (
                                    <ChevronDown size={16} className="text-muted-foreground" color="#fff" />
                                )}
                            </View>
                        </Pressable>

                        {expanded === entry.id && (
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
