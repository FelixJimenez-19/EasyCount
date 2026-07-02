import { Denomination } from "@/app/types/models";
import { fmt } from "@/app/utilities/utilities";
import { Minus, Plus } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";

export default function DenomRow({
    d,
    qty,
    onUpdate,
    onDirect,
}: {
    d: Denomination;
    qty: number;
    onUpdate: (id: string, delta: number) => void;
    onDirect: (id: string, val: string) => void;
}) {
    const subtotal = d.value * qty;
    return (
        <View className="flex flex-row bg-card justify-between items-center gap-3  rounded-2xl px-4 py-3.5 shadow-sm shadow-black/20">
            <View className="w-16">
                <Text className="text-sm font-semibold text-foreground font-mono">{d.label}</Text>
                <Text className="text-[10px] text-muted-foreground mt-0.5 capitalize">{d.type}</Text>
            </View>
            <View className="flex flex-row  items-center justify-center gap-2">
                <Pressable
                    onPress={() => onUpdate(d.id, -1)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform"
                >
                    <Minus size={14} />
                </Pressable>
                <TextInput
                    keyboardType="numeric"
                    value={String(qty)}
                    onChangeText={(text) => onDirect(d.id, text)}
                    // className="w-14 h-9 rounded-xl bg-secondary border border-border text-center text-sm font-semibold font-mono"
                    className="border w-15 h-9 px-2 rounded-xl border-border bg-secondary   text-sm font-semibold font-mono  text-foreground"
                />
                <Pressable
                    onPress={() => onUpdate(d.id, 1)}
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground active:scale-90 transition-transform"
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
