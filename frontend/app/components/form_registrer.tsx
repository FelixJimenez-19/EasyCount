import { UserService } from "@/src/services/user-service";
import { router } from "expo-router";
import { Eye, EyeOff, Mail, User as UserIcon, UserPlus } from "lucide-react-native";
import { useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import Button from "./buttons";
import Input from "./input";
import { useToast } from "./toast";

export default function FormRegistrer() {
    const toast = useToast();
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
            toast.error("Por favor completa todos los campos.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);

        try {
            const response = await UserService.register(trimmedUsername, trimmedEmail, password);

            if (response.success) {
                await UserService.logout();
                toast.success("Tu cuenta fue creada correctamente");
                setTimeout(() => router.replace("/login"), 1200);
            } else {
                toast.error(response.message || "Error al registrar el usuario.");
            }
        } catch {
            toast.error("Ocurrió un error al procesar los datos.");
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
