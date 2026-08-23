import { UserService } from "@/src/services/user-service";
import { Redirect, router } from "expo-router";
import { Keyboard, Pressable, Text, TouchableWithoutFeedback, View } from "react-native";
import FormLogin from "./components/form_login";

export default function LoginScreen() {
    if (UserService.isLoggedIn()) {
        return <Redirect href="/" />;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-background justify-center px-6">
                <View className="items-center mb-10">
                    <Text className="text-3xl font-bold text-primary mb-2">EasyCount</Text>
                    <Text className="text-sm text-muted-foreground">Inicia sesión para continuar</Text>
                </View>

                <FormLogin />

                <View className="flex-row justify-center mt-8 gap-x-1">
                    <Text className="text-muted-foreground text-sm">No tienes cuenta?</Text>
                    <Pressable onPress={() => router.push("/register")}>
                        <Text className="text-primary font-semibold text-sm">Regístrate</Text>
                    </Pressable>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}
