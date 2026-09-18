import { UserService } from "@/src/services/user-service";
import { router } from "expo-router";
import { Eye, EyeOff, Mail, User as UserIcon, UserPlus } from "lucide-react-native";
import { useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import Button from "./buttons";
import Input from "./input";
import { useToast } from "./toast";

export default function FormRegistrer() {
    const { show } = useToast();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        Keyboard.dismiss();
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();

        if (!trimmedUsername || !trimmedEmail || !password || !confirmPassword) {
            show("Campos requeridos", "Por favor completa todos los campos.", { variant: "error" });
            return;
        }

        if (password !== confirmPassword) {
            show("Error", "Las contraseñas no coinciden.", { variant: "error" });
            return;
        }

        if (password.length < 6) {
            show("Error", "La contraseña debe tener al menos 6 caracteres.", { variant: "error" });
            return;
        }

        setLoading(true);

        try {
            const response = await UserService.register(trimmedUsername, trimmedEmail, password);

            if (response.success) {
                await UserService.logout();
                show("Registro exitoso", "Tu cuenta ha sido creada correctamente. Inicia sesión para continuar.", {
                    variant: "success",
                    duration: 4000,
                });
                router.replace("/login");
            } else {
                show("Error", response.message || "Error al registrar el usuario.", { variant: "error" });
            }
        } catch {
            show("Error", "Ocurrió un error al procesar los datos.", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="gap-y-4">
            <Input
                icon={UserIcon}
                label="Usuario"
                value={username}
                onChangeText={setUsername}
                placeholder="Tu nombre de usuario"
                autoCapitalize="none"
                processing={loading}
            />

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
                placeholder="Min. 6 caracteres"
                secureTextEntry={!showPassword}
                processing={loading}
            >
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                </Pressable>
            </Input>

            <Input
                label="Confirmar Contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite tu contraseña"
                secureTextEntry={!showPassword}
                processing={loading}
            >
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                </Pressable>
            </Input>

            <Button label={loading ? "Cargando..." : "Crear Cuenta"} icon={UserPlus} onPress={handleRegister} disabled={loading} size="xl" />
        </View>
    );
}
