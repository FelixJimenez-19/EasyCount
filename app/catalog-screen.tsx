import { Plus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import CatalogSection from "./catalog-section";
import { INITIAL_DENOMINATIONS } from "./utilities/utilities";

export default function CatalogScreen() {
    const [denoms, setDenoms] = useState(INITIAL_DENOMINATIONS);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newLabel, setNewLabel] = useState("");
    const [newValue, setNewValue] = useState("");
    const [newType, setNewType] = useState<"billete" | "moneda">("billete");

    const toggle = (id: string) => setDenoms((prev) => prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d)));

    const addDenom = () => {
        const val = parseFloat(newValue);
        if (!newLabel || isNaN(val)) return;
        setDenoms((prev) => [...prev, { id: `custom-${Date.now()}`, label: newLabel, value: val, type: newType, active: true }]);
        setNewLabel("");
        setNewValue("");
        setShowAddModal(false);
    };

    const bills = denoms.filter((d) => d.type === "billete");
    const coins = denoms.filter((d) => d.type === "moneda");
    return (
        <View className="flex flex-col h-full">
            <View className="px-5 pt-6 pb-4 flex items-center justify-between">
                <View>
                    <Text className="text-xl font-semibold text-foreground">Catálogo</Text>
                    <Text className="text-xs text-muted-foreground mt-1">Denominaciones activas · Ecuador</Text>
                </View>
                <Pressable
                    onPress={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
                >
                    <Plus size={14} />
                    <Text>Nueva</Text>
                </Pressable>
            </View>

            <ScrollView className="flex-1 overflow-y-auto px-4 pb-4 space-y-5" showsVerticalScrollIndicator={false}>
                <CatalogSection title="Billetes" items={bills} onToggle={toggle} />
                <CatalogSection title="Monedas" items={coins} onToggle={toggle} />
                <View className="h-2" />
            </ScrollView>

            {showAddModal && (
                <TouchableOpacity
                    className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
                    onPress={() => setShowAddModal(false)}
                >
                    <TouchableOpacity className="w-full bg-card rounded-t-3xl p-6 pb-8 shadow-2xl" onPress={(e) => e.stopPropagation()}>
                        <View className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                        <Text className="text-lg font-semibold text-foreground mb-4">Agregar Denominación</Text>
                        <View className="space-y-3">
                            <View>
                                <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Tipo</Text>
                                <View className="flex gap-2">
                                    {(["billete", "moneda"] as const).map((t) => (
                                        <Pressable
                                            key={t}
                                            onPress={() => setNewType(t)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors ${
                                                newType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                            }`}
                                        >
                                            {t}
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                            <View>
                                <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Etiqueta</Text>
                                <TextInput
                                    value={newLabel}
                                    onChangeText={(e) => setNewLabel(e.valueOf())}
                                    placeholder="Ej: $2.00"
                                    className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border"
                                />
                            </View>
                            <View>
                                <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Valor numérico</Text>
                                <TextInput
                                    keyboardType="numeric"
                                    //   step="0.01"
                                    value={newValue}
                                    onChangeText={(e) => setNewValue(e.valueOf())}
                                    placeholder="Ej: 2.00"
                                    className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border"
                                />
                            </View>
                        </View>
                        <View className="flex gap-3 mt-5">
                            <Pressable
                                onPress={() => setShowAddModal(false)}
                                className="flex-1 py-3.5 rounded-2xl border border-border text-muted-foreground font-medium text-sm"
                            >
                                <Text>Cancelar</Text>
                            </Pressable>
                            <Pressable
                                onPress={addDenom}
                                className="flex-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
                            >
                                <Text>Agregar</Text>
                            </Pressable>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            )}
        </View>
    );
}
