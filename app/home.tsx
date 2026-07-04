import { CountService } from "@/src/services/count-service";
import { Save } from "lucide-react-native";
import { Dispatch, SetStateAction, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import DenomRow from "./denomrow";
import { Denomination, TransactionDenomination } from "./types/models";
import { fmt } from "./utilities/utilities";

interface HomeProps {
    denominaciones: Denomination[];
    cantidades: Record<number, number>;
    setCantidades: Dispatch<SetStateAction<Record<number, number>>>;
    // observacion: string;
    // setObservacion: Dispatch<SetStateAction<string>>;
    grandTotal: number;
}

export default function Home({ denominaciones, cantidades, setCantidades, grandTotal }: HomeProps) {
    const [observacion, setObservacion] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [saved, setSaved] = useState(false);

    const bills = denominaciones.filter((d) => d.tipo === "Billete");
    const coins = denominaciones.filter((d) => d.tipo === "Moneda");

    // Lógica controlada para botones + y - (onUpdate)
    const handleUpdateCantidad = (id: number, valor: number) => {
        setCantidades((prev) => {
            const actual = prev[id] || 0;
            const nueva = actual + valor;
            return { ...prev, [id]: nueva < 0 ? 0 : nueva }; // Evitamos negativos
        });
    };

    // Lógica para el input de texto directo (onDirect)
    const handleInputChange = (id: number, texto: string) => {
        const numeroLimpio = texto.replace(/[^0-9]/g, "");
        const valorNumerico = numeroLimpio === "" ? 0 : parseInt(numeroLimpio, 10);
        setCantidades((prev) => ({ ...prev, [id]: valorNumerico }));
    };

    const calcularSubtotal = (id: number, valor: number) => (cantidades[id] || 0) * valor;

    // Acción de persistencia definitiva hacia el Backend local
    const handleGuardarCierre = () => {
        if (grandTotal === 0) {
            Alert.alert("Arqueo Vacío", "No puedes guardar un arqueo con saldo de $0.00");
            return;
        }

        // Filtramos solo las monedas que el usuario efectivamente contó
        const desglosesAInsertar: TransactionDenomination[] = denominaciones
            .filter((d) => (cantidades[d.id] || 0) > 0)
            .map((d) => ({
                id_denomination: d.id,
                quantity: cantidades[d.id],
                subtotal: calcularSubtotal(d.id, d.valor),
            }));

        const exito = CountService.saveTransaction(grandTotal, observacion || "Sin observación", desglosesAInsertar);

        setShowModal(false);

        if (exito) {
            setObservacion("");
            setCantidades((prev) => Object.fromEntries(Object.keys(prev).map((key) => [Number(key), 0])));
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } else {
            Alert.alert("Error", "Hubo un problema al intentar escribir en el almacenamiento del dispositivo.");
        }
    };

    return (
        <View className="flex h-full  flex-col  ">
            {/* Scrollable list */}
            <ScrollView className="flex-1 pt-4 " showsVerticalScrollIndicator={false}>
                {bills.length > 0 && (
                    <View>
                        <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 px-1">Billetes</Text>
                        <View className="space-y-2 gap-2 ">
                            {bills.map((d) => (
                                <DenomRow
                                    key={d.id}
                                    denomination={d}
                                    qty={cantidades[d.id] ?? 0}
                                    onUpdate={handleUpdateCantidad}
                                    onDirect={handleInputChange}
                                />
                            ))}
                        </View>
                    </View>
                )}
                {coins.length > 0 && (
                    <View className="">
                        <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 px-1">Monedas</Text>
                        <View className="space-y-2 gap-2">
                            {coins.map((d) => (
                                <DenomRow
                                    key={d.id}
                                    denomination={d}
                                    qty={cantidades[d.id] ?? 0}
                                    onUpdate={handleUpdateCantidad}
                                    onDirect={handleInputChange}
                                />
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
                        <Text className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Observación opcional</Text>
                        <TextInput
                            value={observacion}
                            onChange={(e) => setObservacion(e.nativeEvent.text)}
                            multiline
                            placeholder="Ej: Cierre de caja matutino..."
                            numberOfLines={3}
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
                                onPress={handleGuardarCierre}
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
