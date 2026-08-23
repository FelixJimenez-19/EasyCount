import { UserService } from "@/src/services/user-service";
import { Redirect, router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Keyboard, Pressable, Text, TouchableWithoutFeedback, View } from "react-native";
import FormRegistrer from "./components/form_registrer";

export default function RegisterScreen() {
    if (UserService.isLoggedIn()) {
        return <Redirect href="/" />;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-background justify-center px-6">
                <Pressable onPress={() => router.back()} className="absolute top-16 left-4 w-10 h-10 items-center justify-center">
                    <ArrowLeft size={22} color="#94a3b8" />
                </Pressable>

                <View className="items-center mb-10">
                    <Text className="text-3xl font-bold text-primary mb-2">EasyCount</Text>
                    <Text className="text-sm text-muted-foreground">Crea tu cuenta</Text>
                </View>

                <FormRegistrer />

                <View className="flex-row justify-center mt-8 gap-x-1">
                    <Text className="text-muted-foreground text-sm">Ya tienes cuenta?</Text>
                    <Pressable onPress={() => router.back()}>
                        <Text className="text-primary font-semibold text-sm">Inicia Sesión</Text>
                    </Pressable>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}
