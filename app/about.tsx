import { BookOpen, Info, Mail } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import Logo from "./components/logo";

export default function About() {
    return (
        <View className="flex flex-col h-full">
            <View className="px-5 pt-6 pb-4">
                <Text className="text-xl font-semibold text-foreground">Acerca de</Text>
                <Text className="text-xs text-muted-foreground mt-1">Información de la aplicación</Text>
            </View>
            <ScrollView className="flex-1 overflow-y-auto px-4 pb-4 space-y-4" showsVerticalScrollIndicator={false}>
                {/* App card */}
                <View className="bg-card rounded-3xl p-6 shadow-sm shadow-black/20 flex flex-col items-center text-center">
                    <Logo size={80} />
                    <Text className="text-xl font-bold text-foreground mt-3">EasyCount</Text>
                    <Text className="text-xs text-muted-foreground">v1.0.0</Text>
                    <Text className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-xs">
                        Aplicación de arqueo de caja rápido y preciso. Cuenta billetes y monedas, guarda tus registros y lleva control de cada cierre.
                    </Text>
                </View>

                {/* How to use */}
                <View className="bg-card rounded-2xl p-5 shadow-sm shadow-black/20">
                    <View className="flex items-center gap-2 mb-3">
                        <BookOpen size={16} className="text-primary" />
                        <Text className="text-sm font-semibold text-foreground">Guía rápida de uso</Text>
                    </View>
                    <ol className="space-y-2.5">
                        {[
                            "Selecciona las denominaciones activas en la pestaña Catálogo.",
                            "En Conteo, usa los botones + y − para ingresar la cantidad de cada billete o moneda.",
                            "El gran total se calcula automáticamente en tiempo real.",
                            'Toca "Guardar Arqueo" para registrar el conteo con una observación opcional.',
                            "Consulta todos tus registros anteriores en la pestaña Reportes.",
                        ].map((step, i) => (
                            <li key={i} className="flex gap-3 items-start">
                                <Text className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {i + 1}
                                </Text>
                                <p className="text-sm text-muted-foreground leading-snug">{step}</p>
                            </li>
                        ))}
                    </ol>
                </View>

                {/* Developer */}
                <View className="bg-card rounded-2xl p-5 shadow-sm shadow-black/20">
                    <View className="flex items-center gap-2 mb-3">
                        <Info size={16} className="text-primary" />
                        <Text className="text-sm font-semibold text-foreground">Créditos</Text>
                    </View>
                    <View className="space-y-2 text-sm">
                        <View className="flex justify-between items-center">
                            <Text className="text-muted-foreground">Desarrollado por</Text>
                            <Text className="text-foreground font-medium">EasyCount Dev Team</Text>
                        </View>
                        <View className="flex justify-between items-center">
                            <Text className="text-muted-foreground">Plataforma</Text>
                            <Text className="text-foreground font-medium">Web · Android · iOS</Text>
                        </View>
                        <View className="flex justify-between items-center">
                            <Text className="text-muted-foreground">Región</Text>
                            <Text className="text-foreground font-medium">Ecuador 🇪🇨</Text>
                        </View>
                    </View>
                </View>

                {/* Support */}
                <View className="w-full bg-card rounded-2xl p-4 shadow-sm shadow-black/20 flex items-center gap-3 active:opacity-80 transition-opacity">
                    <View className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Mail size={18} className="text-primary" />
                    </View>
                    <View className="text-left">
                        <Text className="text-sm font-medium text-foreground">Soporte técnico</Text>
                        <Text className="text-xs text-muted-foreground">soporte@easycount.ec</Text>
                    </View>
                </View>

                <View className="h-2" />
            </ScrollView>
        </View>
    );
}
