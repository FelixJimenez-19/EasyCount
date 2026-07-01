import "@/global.css";
import { Text, TextInput, View } from "react-native";

const metadata = [0.5, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 200.0, 500.0, 1000.0, 2000.0, 5000.0, 10000.0];
export default function Index() {
    return (
        <View className="px-5 py-10 bg-white">
            <View className=" gap-2 ">
                {metadata.map((item, index) => (
                    <View key={index} className="text-lg flex-row  text-gray-700">
                        <Text className="bg-red-500 justify-center items-center">{item} X</Text>
                        <TextInput> 0</TextInput>
                        <Text> = </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
