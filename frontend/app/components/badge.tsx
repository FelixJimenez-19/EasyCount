import { Text } from "react-native";

export default function Badge({ children, color = "green" }: { children: React.ReactNode; color?: "green" | "slate" }) {
    return (
        <Text
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                color === "green" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
            }`}
        >
            {children}
        </Text>
    );
}
