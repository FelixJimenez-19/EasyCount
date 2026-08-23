import { UserService } from "@/src/services/user-service";
import { router } from "expo-router";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react-native";
import { useState } from "react";
import { Alert, Keyboard, Pressable, View } from "react-native";
import Button from "./buttons";
import Input from "./input";

export default function FormLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        Keyboard.dismiss();
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            Alert.alert("Campos requeridos", "Por favor ingresa tu correo y contraseña.");
            return;
        }

        setLoading(true);

        try {
            const response = await UserService.login(trimmedEmail, password);

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
        <View className="gap-y-4">
            <Input
                icon={Mail}
                label="Correo"
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                processing={loading}
            />

            <Input
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="Tu contraseña"
                secureTextEntry={!showPassword}
                processing={loading}
            >
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                </Pressable>
            </Input>

            <Button label={loading ? "Cargando..." : "Iniciar Sesión"} icon={LogIn} onPress={handleLogin} disabled={loading} />
        </View>
    );
}
