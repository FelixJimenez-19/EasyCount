import "@/global.css";
import { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthStore } from "@/src/services/auth-store";
import { runMigrations } from "@/src/db/migrate";
import { NotificationService } from "@/src/services/notification-service";
import { ToastProvider, toastBus } from "./components/toast";

export default function RootLayout() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        Promise.all([AuthStore.hydrate(), runMigrations(), NotificationService.init()]).finally(() => setReady(true));
    }, []);

    useEffect(() => {
        const unsubscribe = AuthStore.onSessionExpired(() => {
            toastBus.show("Sesión expirada", "Tu sesión ha expirado. Inicia sesión de nuevo.", { variant: "error" });
            router.replace("/login");
        });
        return unsubscribe;
    }, []);

    if (!ready) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    return (
        <ToastProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            />
        </ToastProvider>
    );
}
