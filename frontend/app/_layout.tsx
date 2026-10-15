import "@/global.css";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { initDatabase } from "@/src/database/database";
import { ToastProvider } from "./components/toast";

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

export default function RootLayout() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        initDatabase().finally(() => setReady(true));
    }, []);

    useEffect(() => {
        if (ready) {
            SplashScreen.hideAsync().catch(() => {});
        }
    }, [ready]);

    if (!ready) {
        return null;
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
