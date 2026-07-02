import { RotateCcw, Save } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Logo from "./components/logo";
import DenomRow from "./denomrow";
import { Denomination } from "./types/models";
import { fmt } from "./utilities/utilities";

const INITIAL_DENOMINATIONS: Denomination[] = [
    { id: "b100", label: "$100.00", value: 100, type: "billete", active: true },
    { id: "b50", label: "$50.00", value: 50, type: "billete", active: true },
    { id: "b20", label: "$20.00", value: 20, type: "billete", active: true },
    { id: "b10", label: "$10.00", value: 10, type: "billete", active: true },
    { id: "b5", label: "$5.00", value: 5, type: "billete", active: true },
    { id: "b1", label: "$1.00", value: 1, type: "billete", active: true },
    { id: "c100", label: "$1.00", value: 1, type: "moneda", active: true },
    { id: "c50", label: "$0.50", value: 0.5, type: "moneda", active: true },
    { id: "c25", label: "$0.25", value: 0.25, type: "moneda", active: true },
    { id: "c10", label: "$0.10", value: 0.1, type: "moneda", active: true },
    { id: "c5", label: "$0.05", value: 0.05, type: "moneda", active: true },
    { id: "c1", label: "$0.01", value: 0.01, type: "moneda", active: false },
];
export default function Home() {
    const activeDenoms = INITIAL_DENOMINATIONS.filter((d) => d.active);
    const [qtys, setQtys] = useState<Record<string, number>>(() => Object.fromEntries(activeDenoms.map((d) => [d.id, 0])));
    const [showModal, setShowModal] = useState(false);
    const [note, setNote] = useState("");
    const [saved, setSaved] = useState(false);

    const update = useCallback((id: string, delta: number) => {
        setQtys((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
    }, []);

    const setDirect = useCallback((id: string, val: string) => {
        const n = parseInt(val, 10);
        setQtys((prev) => ({ ...prev, [id]: isNaN(n) || n < 0 ? 0 : n }));
    }, []);

    const reset = () => setQtys(Object.fromEntries(activeDenoms.map((d) => [d.id, 0])));

    const grandTotal = activeDenoms.reduce((sum, d) => sum + d.value * (qtys[d.id] ?? 0), 0);

    const handleSave = () => {
        setSaved(true);
        setShowModal(false);
        setNote("");
        setTimeout(() => setSaved(false), 2500);
    };

    const bills = activeDenoms.filter((d) => d.type === "billete");
    const coins = activeDenoms.filter((d) => d.type === "moneda");

    return (
        <View className="flex flex-col h-full">
            {/* Header */}
            <View className="flex items-center justify-between px-5 pt-6 pb-4">
                <View className="flex items-center gap-2.5">
                    <Logo size={32} />
                    <View>
                        <Text className="text-lg font-semibold text-foreground leading-none">EasyCount</Text>
                        <Text className="text-xs text-muted-foreground mt-0.5">Conteo de caja</Text>
                    </View>
                </View>
                <Pressable
                    onPress={reset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-muted-foreground text-xs font-medium hover:text-foreground transition-colors"
                >
                    <RotateCcw size={13} />
                    <Text>Reiniciar</Text>
                </Pressable>
            </View>

            {/* Scrollable list */}
            <ScrollView className="flex-1 overflow-y-auto px-4 pb-2 space-y-5" showsVerticalScrollIndicator={false}>
                {bills.length > 0 && (
                    <View>
                        <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 px-1">Billetes</Text>
                        <View className="space-y-2">
                            {bills.map((d) => (
                                <DenomRow key={d.id} d={d} qty={qtys[d.id] ?? 0} onUpdate={update} onDirect={setDirect} />
                            ))}
                        </View>
                    </View>
                )}
                {coins.length > 0 && (
                    <View>
                        <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 px-1">Monedas</Text>
                        <View className="space-y-2">
                            {coins.map((d) => (
                                <DenomRow key={d.id} d={d} qty={qtys[d.id] ?? 0} onUpdate={update} onDirect={setDirect} />
                            ))}
                        </View>
                    </View>
                )}
                <View className="h-2" />
            </ScrollView>

            {/* Sticky footer */}
            <View className="px-4 pb-4 pt-3 border-t border-border bg-background">
                {saved && (
                    <View className="mb-3 px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-2">
                        <View className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <Text className="text-primary text-sm font-medium">Arqueo guardado correctamente</Text>
                    </View>
                )}
                <View className="flex items-baseline justify-between mb-3 px-1">
                    <Text className="text-sm text-muted-foreground font-medium">Gran Total</Text>
                    <Text className="text-3xl font-bold text-primary font-mono">${fmt(grandTotal)}</Text>
                </View>
                <Pressable
                    onPress={() => setShowModal(true)}
                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                    <Save size={18} />

                    <Text>Guardar Arqueo</Text>
                </Pressable>
            </View>

            {/* Modal */}
            {showModal && (
                <TouchableOpacity
                    className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
                    onPress={() => setShowModal(false)}
                >
                    <TouchableOpacity className="w-full bg-card rounded-t-3xl p-6 pb-8 shadow-2xl" onPress={(e) => e.stopPropagation()}>
                        <View className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                        <Text className="text-lg font-semibold text-foreground mb-1">Guardar Arqueo</Text>
                        <Text className="text-sm text-muted-foreground mb-4">
                            Total: <Text className="text-primary font-semibold">${fmt(grandTotal)}</Text>
                        </Text>
                        <Text className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Observación (opcional)</Text>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ej: Cierre de caja matutino..."
                            rows={3}
                            className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-primary/40 border border-border"
                        />
                        <View className="flex gap-3 mt-4">
                            <Pressable
                                onPress={() => setShowModal(false)}
                                className="flex-1 py-3.5 rounded-2xl border border-border text-muted-foreground font-medium text-sm"
                            >
                                <Text>Cancelar</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleSave}
                                className="flex-2 grow-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> <Text>Confirmar</Text>
                            </Pressable>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            )}
        </View>
    );
}
