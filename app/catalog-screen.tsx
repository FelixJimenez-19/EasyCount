import { CountService } from "@/src/services/count-service";
import { BlurView } from "expo-blur";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import CatalogSection from "./catalog-section";
import { Denomination } from "./types/models";
// import { INITIAL_DENOMINATIONS } from "./utilities/utilities";

interface catalogprops {
    denominaciones: Denomination[];
}

export default function CatalogScreen({ denominaciones }: catalogprops) {
    const [denoms, setDenoms] = useState(denominaciones);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newValue, setNewValue] = useState("");
    const [newType, setNewType] = useState<"Billete" | "Moneda">("Billete");
    const [newActive, setNewActive] = useState(true);

    const toggle = (id: number) => {
        const denom = denoms.find((d) => d.id === id);
        if (!denom) return;
        const nextActive = !denom.active;
        const persistido = CountService.toggleDenominacion(id, nextActive);
        if (!persistido) return;
        setDenoms((prev) => prev.map((d) => (d.id === id ? { ...d, active: nextActive } : d)));
    };

    const addDenom = () => {
        const val = parseFloat(newValue);
        if (isNaN(val)) return;
        const nuevo = CountService.addDenominacion(val, newType, newActive);
        if (!nuevo) return;
        setDenoms((prev) => [...prev, nuevo]);
        setNewValue("");
        setNewActive(true);
        setShowAddModal(false);
    };

    const bills = denoms.filter((d) => d.tipo === "Billete");
    const coins = denoms.filter((d) => d.tipo === "Moneda");
    // console.log("mis monedas", bills);
    return (
        <View className="flex h-full">
            <View className="px-5 pt-6 pb-4 flex flex-row items-center justify-between">
                <View>
                    <Text className="text-xl font-semibold text-foreground">Catálogo</Text>
                    <Text className="text-xs text-muted-foreground mt-1">Denominaciones activas · Ecuador</Text>
                </View>
                <Pressable
                    onPress={() => setShowAddModal(true)}
                    className="flex flex-row items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
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
                    // 1. Limpiamos el fondo negro pesado y dejamos el contenedor transparente
                    className="absolute  inset-0 flex  justify-center"
                    activeOpacity={1}
                    onPress={() => setShowAddModal(false)}
                >
                    {/* 2. El BlurView ahora es el encargado de pintar el fondo borroso y oscuro */}
                    <BlurView
                        intensity={40} // Puedes subirlo a 50 o 60 si quieres que se note aún más borroso
                        tint="dark" // Aplica el tinte oscuro premium estilo iOS
                        experimentalBlurMethod="dimezisBlurView"
                        style={StyleSheet.absoluteFill}
                    />

                    {/* 3. Tu formulario (Se mantiene intacto, pero ahora lucirá semitraslúcido si tu clase 'bg-card' tiene algo de opacidad) */}
                    <TouchableOpacity
                        className="w-full bg-card rounded-t-lg mt-auto p-6 pb-8 shadow-lg  z-10"
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                        <Text className="text-lg font-semibold text-foreground mb-4">Agregar Denominación</Text>

                        <View className="space-y-3">
                            <View>
                                <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Tipo</Text>
                                <View className="flex flex-row gap-2">
                                    {(["Billete", "Moneda"] as const).map((t) => (
                                        <Pressable
                                            key={t}
                                            onPress={() => setNewType(t)}
                                            className={`py-2.5 rounded-lg flex-1 items-center text-sm font-medium capitalize transition-colors ${
                                                newType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                            }`}
                                        >
                                            <Text className={newType === t ? "text-primary-foreground" : "text-muted-foreground"}>{t}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <View className="pt-2">
                                <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Valor numérico</Text>
                                <TextInput
                                    keyboardType="numeric"
                                    value={newValue}
                                    onChangeText={(e) => setNewValue(e.valueOf())}
                                    placeholder="Ej: 5.00"
                                    className="w-full bg-secondary rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border"
                                />
                            </View>

                            <View className="pt-2 flex flex-row items-center justify-between">
                                <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Activo</Text>
                                <Pressable onPress={() => setNewActive((prev) => !prev)} className="relative">
                                    {newActive ? <ToggleRight size={36} color="#4ade80" /> : <ToggleLeft size={36} color="#94a3b8" />}
                                </Pressable>
                            </View>
                        </View>

                        <View className="flex flex-row gap-3 mt-5">
                            <Pressable
                                onPress={() => setShowAddModal(false)}
                                className="flex-1 items-center py-3.5 rounded-2xl border border-border font-medium text-sm"
                            >
                                <Text className="text-muted-foreground">Cancelar</Text>
                            </Pressable>
                            <Pressable onPress={addDenom} className="flex-1 py-3.5 items-center rounded-2xl bg-primary font-semibold text-sm">
                                <Text className="text-primary-foreground">Agregar</Text>
                            </Pressable>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            )}
        </View>
    );
}
