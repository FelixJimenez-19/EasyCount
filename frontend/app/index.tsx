import "@/global.css";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import About from "./about";
import CatalogScreen from "./catalog-screen";
import { Redirect } from "expo-router";

import { CountService } from "@/src/services/count-service";
import { UserService } from "@/src/services/user-service";
import { SyncEngine } from "@/src/services/sync-engine";
import Button from "./components/buttons";
import Header from "./components/header";
import Home from "./home";
import ReportScreen from "./report-screen";
import { Denomination, Tab } from "./types/models";
import { TABS } from "./utilities/utilities";

export default function Index() {
    if (!UserService.isLoggedIn()) {
        return <Redirect href="/login" />;
    }
    return <AppContent />;
}

function AppContent() {
    const [activeTab, setActiveTab] = useState<Tab>("conteo");
    const [denominaciones, setDenominaciones] = useState<Denomination[]>([]);
    const [cantidades, setCantidades] = useState<Record<number, number>>({});

    const cargarDenominaciones = useCallback(async () => {
        const datos = await CountService.getDenominaciones();
        setDenominaciones(datos);
        setCantidades(Object.fromEntries(datos.map((d) => [d.id_denomination, 0])));
    }, []);

    useEffect(() => {
        cargarDenominaciones();
        SyncEngine.start();
        return () => SyncEngine.stop();
    }, [cargarDenominaciones]);

    const grandTotal = denominaciones.reduce((sum, d) => sum + d.value * (cantidades[d.id_denomination] ?? 0), 0);
    const hasValues = Object.values(cantidades).some((qty) => qty > 0);
    const reset = () => setCantidades(Object.fromEntries(denominaciones.map((d) => [d.id_denomination, 0])));

    const screen = {
        conteo: <Home denominaciones={denominaciones} cantidades={cantidades} setCantidades={setCantidades} grandTotal={grandTotal} />,
        reportes: <ReportScreen />,
        catalogo: <CatalogScreen denominaciones={denominaciones} onChange={setDenominaciones} />,
        acerca: <About />,
    }[activeTab];

    return (
        <View className={`flex items-center justify-center min-h-screen bg-background ${activeTab === "conteo" ? "pt-10" : "pt-4"}`}>
            {activeTab === "conteo" && <Header showReset={hasValues} onReset={reset} />}
            <View className="flex-1 overflow-hidden w-full   relative">{screen}</View>

            <View className="flex-row shrink-0 border-t w-full border-border bg-card backdrop-blur-md justify-between px-4 pb-5">
                {TABS.map(({ id, label, Icon }) => (
                    <Button
                        key={id}
                        variant="tab"
                        icon={Icon}
                        label={label}
                        className="rounded-xl"
                        active={activeTab === id}
                        onPress={() => setActiveTab(id)}
                    />
                ))}
            </View>
        </View>
    );
}
