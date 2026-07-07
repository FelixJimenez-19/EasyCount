import { Denomination } from "@/app/types/models";
import { fmt } from "@/app/utilities/utilities";
import { Minus, Plus } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";

export default function DenomRow({
    denomination,
    qty,
    onUpdate,
    onDirect,
}: {
    denomination: Denomination;
    qty: number;
    onUpdate: (id: number, delta: number) => void;
    onDirect: (id: number, val: string) => void;
}) {
    const subtotal = denomination.valor * qty;
    return (
        <View className="flex flex-row justify-between items-center gap-3 bg-card rounded-2xl px-4 py-3.5 shadow-sm shadow-black/20">
            <View className="w-16">
                <Text className="text-sm font-semibold text-foreground font-mono">{denomination.valor}</Text>
                <Text className="text-[10px] text-muted-foreground mt-0.5 capitalize">{denomination.tipo}</Text>
            </View>
            <View className="flex-row flex items-center justify-between gap-2">
                <Pressable
                    onPress={() => onUpdate(denomination.id, -1)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground active:opacity-80"
                >
                    <Minus size={14} />
                </Pressable>
                <TextInput
                    keyboardType="numeric"
                    value={qty.toString()}
                    onChangeText={(number) => onDirect(denomination.id, number)}
                    className="border w-14  px-2 rounded-xl border-border bg-secondary text-sm font-semibold font-mono  text-foreground"
                />
                <Pressable
                    onPress={() => onUpdate(denomination.id, 1)}
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground active:opacity-80"
                >
                    <Plus size={14} />
                </Pressable>
            </View>
            <View className="w-20 text-right">
                <Text className={`text-sm font-bold font-mono ${subtotal > 0 ? "text-primary" : "text-muted-foreground"}`}>${fmt(subtotal)}</Text>
            </View>
        </View>
    );
}
