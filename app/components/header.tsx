import { RotateCcw } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import Logo from "./logo";

interface HeaderProps {
    showReset: boolean;
    onReset: () => void;
}

export default function Header({ showReset, onReset }: HeaderProps) {
    return (
        <View className="flex flex-row items-center top-0 justify-between  pt-3 w-full">
            <View className="flex flex-row items-center gap-2.5">
                <Logo size={32} />
                <View>
                    <Text className="text-lg font-semibold text-foreground leading-none">EasyCount</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">Conteo de caja</Text>
                </View>
            </View>

            {showReset && (
                <Pressable
                    onPress={onReset}
                    className="flex flex-row items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-secondary text-muted-foreground text-xs font-medium hover:text-foreground transition-colors"
                >
                    <RotateCcw size={13} />
                    <Text>Reiniciar</Text>
                </Pressable>
            )}
        </View>
    );
}
