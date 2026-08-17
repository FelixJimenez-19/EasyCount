import { ToggleLeft, ToggleRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Denomination } from "./types/models";

export default function CatalogSection({ title, items, onToggle }: { title: string; items: Denomination[]; onToggle: (id: number) => void }) {
    return (
        <View>
            <Text className="text-xs font-medium  text-muted-foreground uppercase tracking-widest mb-3 px-1">{title}</Text>
            <View className="space-y-2 flex  gap-2">
                {items.map((d) => (
                    <View
                        key={d.id_denomination}
                        className="flex flex-row items-center justify-between bg-card rounded-2xl px-4 py-3.5 shadow-sm shadow-black/20"
                    >
                        <View>
                            <Text className="text-sm font-semibold text-foreground font-mono">{d.value}</Text>
                            <Text className="text-[10px] text-muted-foreground mt-0.5 capitalize">{d.type}</Text>
                        </View>
                        <Pressable onPress={() => onToggle(d.id_denomination)} className="relative">
                            {d.active ? <ToggleRight size={36} color="#4ade80" /> : <ToggleLeft size={36} color="#94a3b8" />}
                        </Pressable>
                    </View>
                ))}
            </View>
        </View>
    );
}
