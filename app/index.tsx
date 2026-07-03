import "@/global.css";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import About from "./about";
import CatalogScreen from "./catalog-screen";

import { initDatabase } from "@/src/database/database";
import Header from "./components/header";
import Home from "./home";
import ReportScreen from "./report-screen";
import { Tab } from "./types/models";
import { INITIAL_DENOMINATIONS, TABS } from "./utilities/utilities";

export default function Index() {
    const activeDenoms = INITIAL_DENOMINATIONS.filter((d) => d.active);
    const [qtys, setQtys] = useState<Record<string, number>>(() => Object.fromEntries(activeDenoms.map((d) => [d.id, 0])));
    const reset = () => setQtys(Object.fromEntries(activeDenoms.map((d) => [d.id, 0])));
    const [activeTab, setActiveTab] = useState<Tab>("conteo");
    const grandTotal = activeDenoms.reduce((sum, d) => sum + d.value * (qtys[d.id] ?? 0), 0);
    const hasValues = Object.values(qtys).some((qty) => qty > 0);

    const screen = {
        conteo: <Home grandTotal={grandTotal} qtys={qtys} setQtys={setQtys} />,
        reportes: <ReportScreen />,
        catalogo: <CatalogScreen />,
        acerca: <About />,
    }[activeTab];

    useEffect(() => {
        initDatabase();
    }, []);
    return (
        <View className="flex items-center justify-center   min-h-screen bg-background pt-10   ">
            <Header showReset={activeTab === "conteo" && hasValues} onReset={reset} />
            <View className="flex-1 overflow-hidden w-full px-4  relative">{screen}</View>

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
                                <Icon size={22} className={`transition-colors ${active ? "text-primary" : "text-foreground   "}`} />
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
