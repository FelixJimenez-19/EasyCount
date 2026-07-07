import "@/global.css";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import About from "./about";
import CatalogScreen from "./catalog-screen";

import { initDatabase } from "@/src/database/database";
import { CountService } from "@/src/services/count-service";
import Header from "./components/header";
import Home from "./home";
import ReportScreen from "./report-screen";
import { Denomination, Tab } from "./types/models";
import { TABS } from "./utilities/utilities";

export default function Index() {
    const [activeTab, setActiveTab] = useState<Tab>("conteo");
    const [denominaciones, setDenominaciones] = useState<Denomination[]>([]);
    const [cantidades, setCantidades] = useState<Record<number, number>>({});
    // const [observacion, setObservacion] = useState("");

    // console.log(denominaciones);
    const cargarDenominaciones = useCallback(() => {
        const datos = CountService.getDenominaciones();
        setDenominaciones(datos);
        setCantidades(Object.fromEntries(datos.map((d) => [d.id, 0])));
    }, []);

    useEffect(() => {
        initDatabase().then(cargarDenominaciones);
    }, [cargarDenominaciones]);

    const grandTotal = denominaciones.reduce((sum, d) => sum + d.valor * (cantidades[d.id] ?? 0), 0);
    const hasValues = Object.values(cantidades).some((qty) => qty > 0);
    const reset = () => setCantidades(Object.fromEntries(denominaciones.map((d) => [d.id, 0])));

    const primary = "#10b981";
    const foreground = "#fff";

    const screen = {
        conteo: (
            <Home
                denominaciones={denominaciones}
                cantidades={cantidades}
                setCantidades={setCantidades}
                // observacion={observacion}
                // setObservacion={setObservacion}
                grandTotal={grandTotal}
            />
        ),
        reportes: <ReportScreen />,
        catalogo: <CatalogScreen denominaciones={denominaciones} />,
        acerca: <About />,
    }[activeTab];

    return (
        <View className="flex items-center justify-center   min-h-screen bg-background pt-10   ">
            <Header showReset={activeTab === "conteo" && hasValues} onReset={reset} />
            <View className="flex-1 overflow-hidden w-full   relative">{screen}</View>

            {/* Bottom tab bar */}
            <View className="flex-row shrink-0 border-t w-full border-border bg-card backdrop-blur-md justify-between px-4 pb-5">
                {TABS.map(({ id, label, Icon }) => {
                    const active = activeTab === id;
                    return (
                        <Pressable
                            key={id}
                            onPress={() => setActiveTab(id)}
                            className="flex flex-col items-center gap-1 py-1.5 px-4  rounded-2xl  transition-all"
                        >
                            <View
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                                    active ? "bg-primary/15" : "bg-transparent"
                                }`}
                            >
                                <Icon size={22} className={`transition-colors  `} color={active ? primary : foreground} />
                            </View>
                            <Text className={`text-[10px] font-medium leading-none transition-colors ${active ? "text-primary" : "text-foreground"}`}>
                                {label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
