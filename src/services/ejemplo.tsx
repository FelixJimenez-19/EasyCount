import { Minus, Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ArqueoService, Denominacion, DetalleConteo } from "../services/arqueoService";

export default function ConteoScreen() {
    // Estados para manejar el frontend
    const [denominaciones, setDenominaciones] = useState<Denominacion[]>([]);
    const [cantidades, setCantidades] = useState<{ [key: number]: number }>({});
    const [observacion, setObservacion] = useState("");

    // 1. Cargar el catálogo dinámico de la BD al abrir la pantalla
    useEffect(() => {
        const datosCargados = ArqueoService.getDenominaciones();
        setDenominaciones(datosCargados);

        // Inicializamos las cantidades de cada ID de moneda en cero
        const inicializarCantidades: { [key: number]: number } = {};
        datosCargados.forEach((d) => {
            inicializarCantidades[d.id_denominacion] = 0;
        });
        setCantidades(inicializarCantidades);
    }, []);

    // 2. Lógica controlada para botones + y - (onUpdate)
    const handleUpdateCantidad = (id: number, cambio: number) => {
        setCantidades((prev) => {
            const actual = prev[id] || 0;
            const nueva = actual + cambio;
            return { ...prev, [id]: nueva < 0 ? 0 : nueva }; // Evitamos negativos
        });
    };

    // 3. Lógica para el input de texto directo (onDirect)
    const handleInputChange = (id: number, texto: string) => {
        const numeroLimpio = texto.replace(/[^0-9]/g, "");
        const valorNumerico = numeroLimpio === "" ? 0 : parseInt(numeroLimpio, 10);
        setCantidades((prev) => ({ ...prev, [id]: valorNumerico }));
    };

    // 4. Cálculos dinámicos al vuelo en el Frontend
    const calcularSubtotal = (id: number, valor: number) => {
        const qty = cantidades[id] || 0;
        return qty * valor;
    };

    const calcularGranTotal = () => {
        return denominaciones.reduce((acc, d) => acc + calcularSubtotal(d.id_denominacion, d.valor), 0);
    };

    // 5. Acción de persistencia definitiva hacia el Backend local
    const handleGuardarCierre = () => {
        const granTotal = calcularGranTotal();

        if (granTotal === 0) {
            Alert.alert("Arqueo Vacío", "No puedes guardar un arqueo con saldo de $0.00");
            return;
        }

        // Filtramos solo las monedas que el usuario efectivamente contó
        const desglosesAInsertar: DetalleConteo[] = denominaciones
            .filter((d) => (cantidades[d.id_denominacion] || 0) > 0)
            .map((d) => ({
                id_denominacion: d.id_denominacion,
                cantidad: cantidades[d.id_denominacion],
                subtotal: calcularSubtotal(d.id_denominacion, d.valor),
            }));

        // Enviamos el bloque empaquetado a la capa de servicios
        const exito = ArqueoService.guardarArqueo(granTotal, observacion || "Sin observación", desglosesAInsertar);

        if (exito) {
            Alert.alert("Éxito", "El arqueo de caja se ha guardado en el historial local.");
            // Opcional: Reiniciamos las casillas a cero
            setObservacion("");
            setCantidades((prev) => {
                const reset: { [key: number]: number } = {};
                Object.keys(prev).forEach((key) => {
                    reset[Number(key)] = 0;
                });
                return reset;
            });
        } else {
            Alert.alert("Error", "Hubo un problema al intentar escribir en el almacenamiento del dispositivo.");
        }
    };

    return (
        <View className="flex-1 bg-slate-900 pt-6">
            <Text className="text-white text-2xl font-bold px-4 mb-4 text-center">EasyCount Conteo</Text>

            <ScrollView className="flex-1 px-4" contentContainerClassName="gap-y-3 pb-32" showsVerticalScrollIndicator={false}>
                {denominaciones.map((d) => (
                    <View key={d.id_denominacion} className="flex-row items-center justify-between bg-slate-800 p-4 rounded-2xl shadow-sm">
                        <View className="flex-1">
                            <Text className="text-white text-base font-bold">${d.valor.toFixed(2)}</Text>
                            <Text className="text-slate-400 text-xs">{d.tipo}</Text>
                        </View>

                        {/* Selector Numérico Defensivo */}
                        <View className="flex-row items-center gap-x-2">
                            <Pressable
                                onPress={() => handleUpdateCantidad(d.id_denominacion, -1)}
                                className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center active:scale-90"
                            >
                                <Minus size={14} className="text-white" />
                            </Pressable>

                            <TextInput
                                keyboardType="numeric"
                                value={
                                    cantidades[d.id_denominacion] && cantidades[d.id_denominacion] !== 0
                                        ? cantidades[d.id_denominacion].toString()
                                        : ""
                                }
                                onChangeText={(text) => handleInputChange(d.id_denominacion, text)}
                                placeholder="0"
                                placeholderTextColor="#64748b"
                                className="border w-14 h-9 px-2 rounded-xl border-slate-600 bg-slate-700 text-sm font-semibold text-center text-white font-mono"
                            />

                            <Pressable
                                onPress={() => handleUpdateCantidad(d.id_denominacion, 1)}
                                className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center active:scale-90"
                            >
                                <Plus size={14} className="text-slate-900" />
                            </Pressable>
                        </View>

                        {/* Subtotal de Fila */}
                        <Text className="text-emerald-400 font-mono font-bold text-base w-24 text-right">
                            ${calcularSubtotal(d.id_denominacion, d.valor).toFixed(2)}
                        </Text>
                    </View>
                ))}
            </ScrollView>

            {/* Contenedor Fijo del Gran Total */}
            <View className="absolute bottom-0 left-0 right-0 bg-slate-950 p-5 rounded-t-3xl border-t border-slate-800">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-slate-400 font-medium">Total Acumulado:</Text>
                    <Text className="text-emerald-400 font-mono text-2xl font-black">${calcularGranTotal().toFixed(2)}</Text>
                </View>
                <Pressable
                    onPress={handleGuardarCierre}
                    className="w-full bg-emerald-500 py-3.5 rounded-xl items-center justify-center active:opacity-90"
                >
                    <Text className="text-slate-950 font-bold text-base">Guardar Arqueo</Text>
                </Pressable>
            </View>
        </View>
    );
}
