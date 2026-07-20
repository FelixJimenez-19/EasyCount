import { UserService } from "@/src/services/user-service";
import { Redirect, router } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Mail, User as UserIcon, UserPlus } from "lucide-react-native";
import { useState } from "react";
import { Alert, Keyboard, Pressable, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";

export default function RegisterScreen() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    if (UserService.isLoggedIn()) {
        return <Redirect href="/" />;
    }

    const handleRegister = () => {
        Keyboard.dismiss();
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();

        if (!trimmedUsername || !trimmedEmail || !password || !confirmPassword) {
            Alert.alert("Campos requeridos", "Por favor completa todos los campos.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);

        try {
            const response = UserService.register(trimmedUsername, trimmedEmail, password);

            if (response.success) {
                UserService.logout();
                Alert.alert("Registro exitoso", "Tu cuenta ha sido creada correctamente. Inicia sesión para continuar.", [
                    { text: "Ir al Login", onPress: () => router.replace("/login") },
                ]);
            } else {
                Alert.alert("Error", response.message || "Error al registrar el usuario.");
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
                <Pressable onPress={() => router.back()} className="absolute top-16 left-4 w-10 h-10 items-center justify-center">
                    <ArrowLeft size={22} color="#94a3b8" />
                </Pressable>

                <View className="items-center mb-10">
                    <Text className="text-3xl font-bold text-primary mb-2">EasyCount</Text>
                    <Text className="text-sm text-muted-foreground">Crea tu cuenta</Text>
                </View>

                <View className="gap-y-4">
                    <View>
                        <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2 px-1">Usuario</Text>
                        <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 py-3.5 gap-x-3">
                            <UserIcon size={18} color="#94a3b8" />
                            <TextInput
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Tu nombre de usuario"
                                placeholderTextColor="#64748b"
                                autoCapitalize="none"
                                className="flex-1 text-foreground text-base"
                            />
                        </View>
                    </View>

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
                                placeholder="Min. 6 caracteres"
                                placeholderTextColor="#64748b"
                                secureTextEntry={!showPassword}
                                className="flex-1 text-foreground text-base"
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2 px-1">Confirmar Contraseña</Text>
                        <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 py-3.5 gap-x-3">
                            <Pressable onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                            </Pressable>
                            <TextInput
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Repite tu contraseña"
                                placeholderTextColor="#64748b"
                                secureTextEntry={!showPassword}
                                className="flex-1 text-foreground text-base"
                            />
                        </View>
                    </View>

                    <Pressable
                        onPress={handleRegister}
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl bg-primary flex-row items-center justify-center gap-2 active:scale-[0.98] transition-transform mt-2 ${loading ? "opacity-60" : ""}`}
                    >
                        <UserPlus size={18} color="#0f172a" />
                        <Text className="text-primary-foreground font-semibold text-base">{loading ? "Cargando..." : "Crear Cuenta"}</Text>
                    </Pressable>
                </View>

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
