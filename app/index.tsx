import "@/global.css";
import { View } from "react-native";
import Home from "./home";

export default function Index() {
    return (
        <View className="px-5 py-10 bg-white">
            <Home />
        </View>
    );
}
