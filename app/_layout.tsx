import "@/global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { initDatabase } from "@/src/database/database";

export default function RootLayout() {
    useEffect(() => {
        initDatabase();
    }, []);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        />
    );
}
