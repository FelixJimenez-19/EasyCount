import { UserService } from "@/src/services/user-service";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, TouchableWithoutFeedback, View, Keyboard } from "react-native";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react-native";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    if (UserService.isLoggedIn()) {
        return <Redirect href="/" />;
    }

    const handleLogin = () => {
        Keyboard.dismiss();
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            Alert.alert("Campos requeridos", "Por favor ingresa tu correo y contraseña.");
            return;
        }

        setLoading(true);

        try {
            const response = UserService.login(trimmedEmail, password);

            if (response.success) {
                router.replace("/");
            } else {
                Alert.alert("Error", response.message || "Error al iniciar sesión.");
            }
        } catch {
            Alert.alert("Error", "Ocurrió un error al procesar los datos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-background justify-center px-6">
                <View className="items-center mb-10">
                    <Text className="text-3xl font-bold text-primary mb-2">EasyCount</Text>
                    <Text className="text-sm text-muted-foreground">Inicia sesión para continuar</Text>
                </View>

                <View className="gap-y-4">
                    <View>
                        <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2 px-1">Correo</Text>
                        <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 py-3.5 gap-x-3">
                            <Mail size={18} color="#94a3b8" />
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="tu@correo.com"
                                placeholderTextColor="#64748b"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                className="flex-1 text-foreground text-base"
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2 px-1">Contraseña</Text>
                        <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 py-3.5 gap-x-3">
                            <Pressable onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                            </Pressable>
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Tu contraseña"
                                placeholderTextColor="#64748b"
                                secureTextEntry={!showPassword}
                                className="flex-1 text-foreground text-base"
                            />
                        </View>
                    </View>

                    <Pressable
                        onPress={handleLogin}
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl bg-primary flex-row items-center justify-center gap-2 active:scale-[0.98] transition-transform ${loading ? "opacity-60" : ""}`}
                    >
                        <LogIn size={18} color="#0f172a" />
                        <Text className="text-primary-foreground font-semibold text-base">{loading ? "Cargando..." : "Iniciar Sesión"}</Text>
                    </Pressable>
                </View>

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
