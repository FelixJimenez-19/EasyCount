import { Save } from "lucide-react-native";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import DenomRow from "./denomrow";
import { fmt, INITIAL_DENOMINATIONS } from "./utilities/utilities";

interface HomeProps {
    grandTotal: number;
    qtys: Record<string, number>;
    setQtys: Dispatch<SetStateAction<Record<string, number>>>;
}

export default function Home({ grandTotal, qtys, setQtys }: HomeProps) {
    const activeDenoms = INITIAL_DENOMINATIONS.filter((d) => d.active);
    const [showModal, setShowModal] = useState(false);
    const [note, setNote] = useState("");
    const [saved, setSaved] = useState(false);

    const update = useCallback(
        (id: string, delta: number) => {
            setQtys((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
        },
        [setQtys]
    );

    const setDirect = useCallback(
        (id: string, val: string) => {
            const n = parseInt(val, 10);
            setQtys((prev) => ({ ...prev, [id]: isNaN(n) || n < 0 ? 0 : n }));
        },
        [setQtys]
    );

    const handleSave = () => {
        setSaved(true);
        setShowModal(false);
        setNote("");
        setTimeout(() => setSaved(false), 2500);
    };

    const bills = activeDenoms.filter((d) => d.type === "billete");
    const coins = activeDenoms.filter((d) => d.type === "moneda");

    return (
        <View className="flex h-full  flex-col  ">
            {/* Header */}

            {/* Scrollable list */}
            <ScrollView className="flex-1 pt-4 " showsVerticalScrollIndicator={false}>
                {bills.length > 0 && (
                    <View>
                        <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 px-1">Billetes</Text>
                        <View className="space-y-2 gap-2 ">
                            {bills.map((d) => (
                                <DenomRow key={d.id} d={d} qty={qtys[d.id] ?? 0} onUpdate={update} onDirect={setDirect} />
                            ))}
                        </View>
                    </View>
                )}
                {coins.length > 0 && (
                    <View className="">
                        <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 px-1">Monedas</Text>
                        <View className="space-y-2 gap-2">
                            {coins.map((d) => (
                                <DenomRow key={d.id} d={d} qty={qtys[d.id] ?? 0} onUpdate={update} onDirect={setDirect} />
                            ))}
                        </View>
                    </View>
                )}
                <View className="h-2" />
            </ScrollView>

            {/* Sticky footer */}
            <View className="px-4 pb-4 pt-3 border-t  border-border ">
                {saved && (
                    <View className="mb-3 px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-2">
                        <View className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <Text className="text-primary text-sm font-medium">Arqueo guardado correctamente</Text>
                    </View>
                )}
                <View className="flex flex-row items-baseline justify-between mb-3 px-1 ">
                    <Text className="text-sm text-muted-foreground font-medium">Total</Text>
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
                        <Text className="text-lg font-semibold text-foreground mb-1">Guardar Conteo</Text>
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
                        <View className="flex flex-row gap-3 mt-4">
                            <Pressable
                                onPress={() => setShowModal(false)}
                                className="flex-1 py-3.5 rounded-2xl border items-center text-center border-border text-muted-foreground font-medium text-sm"
                            >
                                <Text>Cancelar</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleSave}
                                className="flex flex-row grow-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm  items-center justify-center gap-2"
                            >
                                <Save size={16} />
                                <Text>Confirmar</Text>
                            </Pressable>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            )}
        </View>
    );
}
