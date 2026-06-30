import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
    console.log("first");

    return (
        <View style={styles.container}>
            <Text>Open up App.tsx to start working on your app!</Text>
            <StatusBar style="auto" />
            <Text>cosas de la vida xd</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#02a4fd",
        alignItems: "center",
        justifyContent: "center",
    },
});
