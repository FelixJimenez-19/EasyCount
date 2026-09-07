import "@/global.css";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthStore } from "@/src/services/auth-store";
import { runMigrations } from "@/src/db/migrate";

export default function RootLayout() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        Promise.all([AuthStore.hydrate(), runMigrations()]).finally(() => setReady(true));
    }, []);

    if (!ready) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        />
    );
}
