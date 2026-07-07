import { BookOpen, Info, Mail } from "lucide-react-native";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import Logo from "./components/logo";

const credits = [
    { label: "Desarrollado por", value: "Felix Jimenez Dev" },
    { label: "Plataforma", value: "Android " },
    { label: "Región", value: "Ecuador" },
];
// Función encargada de disparar el enlace mailto
const handleEmailPress = async () => {
    const email = "fr.jimenezv@uea.edu.ec";
    const subject = "Soporte Técnico - EasyCount";
    const body = "Hola equipo de EasyCount,\n\nNecesito ayuda con...";

    // Construimos la URL con los parámetros correspondientes
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
        // Verificamos si el dispositivo tiene alguna app de correo instalada
        const supported = await Linking.canOpenURL(url);

        if (supported) {
            await Linking.openURL(url);
        } else {
            // Alerta en caso de que sea un emulador o no tenga app de correo
            Alert.alert("Error", "No se encontró una aplicación de correo configurada en este dispositivo.");
        }
    } catch (error) {
        Alert.alert("Error", "No se pudo abrir el correo electrónico." + error);
    }
};

export default function About() {
    return (
        <View className="flex-1 h-full bg-slate-900">
            <View className="px-5 pt-6 pb-4">
                <Text className="text-xl font-semibold text-foreground">Acerca de</Text>
                <Text className="text-xs text-muted-foreground mt-1">Información de la aplicación</Text>
            </View>
            <ScrollView className="flex-1 px-4" contentContainerClassName="gap-y-4 pb-10" showsVerticalScrollIndicator={false}>
                <View className="bg-card rounded-3xl p-6 shadow-sm shadow-black/20 flex-col items-center">
                    <Logo size={80} />
                    <Text className="text-xl font-bold text-foreground mt-3 text-center">EasyCount</Text>
                    <Text className="text-xs text-muted-foreground text-center">v1.0.0</Text>
                    <Text className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-xs text-center">
                        Aplicación de conteo de caja rápido y preciso. Cuenta billetes y monedas, guarda tus registros y lleva control de cada cierre.
                    </Text>
                </View>
                <View className="bg-card rounded-2xl p-5 shadow-sm shadow-black/20">
                    <View className="flex-row items-center gap-x-2 mb-4">
                        <BookOpen size={16} color="#4ade80" />
                        <Text className="text-sm font-semibold text-foreground">Guía rápida de uso</Text>
                    </View>
                    <View className="gap-y-3">
                        {[
                            "Selecciona las denominaciones activas en la pestaña Catálogo.",
                            "En Conteo, usa los botones + y − para ingresar la cantidad de cada billete o moneda.",
                            "El total se calcula automáticamente en tiempo real.",
                            'Toca "Guardar" para registrar el conteo con una observación opcional.',
                            "Consulta todos tus registros anteriores en la pestaña Reportes.",
                        ].map((step, i) => (
                            <View key={i} className="flex-row gap-x-3 items-start py-0.5">
                                <Text className="w-5 h-5 rounded-full bg-primary/15 text-primary my-auto text-[10px] font-bold text-center  items-center shrink-0 mt-0.5">
                                    {i + 1}
                                </Text>

                                <Text className="text-sm text-muted-foreground leading-snug flex-1">{step}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View className="bg-card rounded-2xl p-5 shadow-sm shadow-black/20">
                    <View className="flex-row items-center gap-x-2 mb-4">
                        <Info size={16} color="#4ade80" />
                        <Text className="text-sm font-semibold text-foreground">Créditos</Text>
                    </View>

                    <View className="gap-y-3 text-sm">
                        {credits.map((item, i) => (
                            <View key={i} className="flex-row justify-between items-center">
                                <Text className="text-muted-foreground">{item.label}</Text>
                                <Text className="text-foreground font-medium">{item.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                <Pressable className="w-full bg-card rounded-2xl p-4 shadow-sm shadow-black/20 flex-row items-center gap-x-3 active:opacity-80">
                    <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                        <Mail size={18} color="#4ade80" />
                    </View>
                    <Pressable className="flex-1" onPress={handleEmailPress}>
                        <Text className="text-sm font-medium text-foreground">Soporte técnico</Text>
                        <Text className="text-xs text-muted-foreground">fr.jimenezv@uea.edu.ec</Text>
                    </Pressable>
                </Pressable>
            </ScrollView>
        </View>
    );
}
