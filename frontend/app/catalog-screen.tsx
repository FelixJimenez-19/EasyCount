import { CountService } from "@/src/services/count-service";
import { BlurView } from "expo-blur";
import { Plus, Save, ToggleLeft, ToggleRight } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import CatalogSection from "./catalog-section";
import { Denomination } from "./types/models";
import Button from "./components/buttons";
import Input from "./components/input";
import { useToast } from "./components/toast";
// import { INITIAL_DENOMINATIONS } from "./utilities/utilities";

interface catalogprops {
    denominaciones: Denomination[];
    onChange?: (denoms: Denomination[]) => void;
}

export default function CatalogScreen({ denominaciones, onChange }: catalogprops) {
    const { show } = useToast();
    const [denoms, setDenoms] = useState(denominaciones);
    const [baseline, setBaseline] = useState(denominaciones);
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newValue, setNewValue] = useState("");
    const [newType, setNewType] = useState<"Billete" | "Moneda">("Billete");
    const [newActive, setNewActive] = useState(true);

    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const toggle = (id: number) => {
        setDenoms((prev) => prev.map((d) => (d.id_denomination === id ? { ...d, active: !d.active } : d)));
    };

    const pendingChanges = denoms.filter((d) => {
        const original = baseline.find((b) => b.id_denomination === d.id_denomination);
        return original && original.active !== d.active;
    });

    const guardar = async () => {
        if (pendingChanges.length === 0 || saving) return;
        setSaving(true);
        const ok = await CountService.saveDenominaciones(
            pendingChanges.map((d) => ({ id_denomination: d.id_denomination, active: d.active }))
        );
        setSaving(false);
        if (!ok) {
            show("Error", "No se pudieron guardar los cambios. Inténtalo de nuevo.", { variant: "error" });
            return;
        }
        setBaseline(denoms);
        onChange?.(denoms);
        show("Guardado", "Las denominaciones se guardaron correctamente.", { variant: "success" });
    };

    useEffect(() => {
        const showEvt = Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow";
        const hideEvt = Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide";
        const showSub = Keyboard.addListener(showEvt, (e) => setKeyboardHeight(e.endCoordinates.height));
        const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);
    const addDenom = async () => {
        const val = parseFloat(newValue);
        if (isNaN(val)) return;
        if (val <= 0) {
            show("Valor inválido", "El valor de la denominación debe ser mayor a $0.00", { variant: "error" });
            return;
        }
        const nuevo = await CountService.addDenominacion(val, newType, newActive);
        if (!nuevo) return;
        const updated = [...denoms, nuevo];
        setDenoms(updated);
        setBaseline((prev) => [...prev, nuevo]);
        onChange?.(updated);
        setNewValue("");
        setNewActive(true);
        setShowAddModal(false);
    };

    const bills = denoms.filter((d) => d.type === "Billete");
    const coins = denoms.filter((d) => d.type === "Moneda");
    // console.log("mis monedas", bills);
    return (
        <View className="flex h-full">
            <View className="px-5 pt-6 pb-4 flex flex-row items-center justify-between">
                <View>
                    <Text className="text-xl font-semibold text-foreground">Catálogo</Text>
                    <Text className="text-xs text-muted-foreground mt-1">Denominaciones activas · Ecuador</Text>
                </View>

                <Button label="Nueva" variant="primary" icon={Plus} onPress={() => setShowAddModal(true)} />
            </View>

            <ScrollView className="flex-1 overflow-y-auto px-4 pb-4 space-y-5" showsVerticalScrollIndicator={false}>
                <CatalogSection title="Billetes" items={bills} onToggle={toggle} />
                <CatalogSection title="Monedas" items={coins} onToggle={toggle} />
                <View className="h-2" />
            </ScrollView>

            <View className="px-4 pt-3 pb-4 border-t border-border bg-background">
                {pendingChanges.length > 0 && (
                    <Text className="text-xs text-muted-foreground text-center mb-2">
                        {pendingChanges.length} {pendingChanges.length === 1 ? "cambio" : "cambios"} sin guardar
                    </Text>
                )}
                <Button
                    label={saving ? "Guardando..." : "Guardar"}
                    variant="primary"
                    size="lg"
                    icon={Save}
                    disabled={pendingChanges.length === 0 || saving}
                    className={pendingChanges.length === 0 || saving ? "opacity-50" : ""}
                    onPress={guardar}
                />
            </View>

            {showAddModal && (
                <Modal visible={showAddModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowAddModal(false)}>
                    <TouchableOpacity className="absolute  inset-0 flex  justify-center" activeOpacity={1} onPress={() => setShowAddModal(false)}>
                        <BlurView intensity={40} tint="dark" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
                        <View className="flex-1 justify-end" style={{ paddingBottom: keyboardHeight }}>
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
                                                    className={`py-2.5 rounded-lg flex-1 items-center text-sm font-medium capitalize  ${
                                                        newType === t ? "bg-primary " : "bg-secondary "
                                                    }`}
                                                >
                                                    <Text className={newType === t ? "text-primary-foreground" : "text-muted-foreground"}>{t}</Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </View>

                                    <View className="pt-2">
                                        <Input
                                            label="Valor Numerico"
                                            keyboardType="numeric"
                                            value={newValue}
                                            onChangeText={(e) => setNewValue(e.valueOf())}
                                            placeholder="Ej: 5.00"
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
                                    <Button label="Cancelar" variant="outline" className="flex-1" onPress={() => setShowAddModal(false)} />
                                    <Button label="Agregar" variant="primary" className="flex-1" onPress={addDenom} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}
        </View>
    );
}
