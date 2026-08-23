import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

interface InputProps extends Omit<TextInputProps, "children"> {
    icon?: LucideIcon;
    label?: string;
    error?: string;
    processing?: boolean;
    className?: string;
    classInput?: string;
    children?: ReactNode;
}

export default function Input({
    icon: Icon,
    label = "",
    error = "",
    processing = false,
    className = "",
    classInput = "",
    children,
    ...props
}: InputProps) {
    return (
        <View className={className}>
            {label ? (
                <Text className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2 px-1">
                    {label}
                </Text>
            ) : null}

            <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 py-3.5 gap-x-3">
                {Icon ? <Icon size={18} color="#94a3b8" /> : null}
                {children}
                <TextInput
                    className={cn("flex-1 text-foreground text-base", classInput)}
                    placeholderTextColor="#64748b"
                    {...props}
                    editable={!processing}
                />
            </View>

            {error ? <Text className="text-xs text-red-500 mt-0.5 px-1">{error}</Text> : null}
        </View>
    );
}
