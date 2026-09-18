import { AlertCircle, CheckCircle2, Info, X } from "lucide-react-native";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastVariant = "success" | "error" | "info";

interface ToastOptions {
    variant?: ToastVariant;
    duration?: number;
}

interface ToastState {
    id: number;
    title: string;
    message?: string;
    variant: ToastVariant;
}

interface ToastContextValue {
    show: (title: string, message?: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

type BusShow = (title: string, message?: string, options?: ToastOptions) => void;
let busShow: BusShow | null = null;

/**
 * Bus global para mostrar toasts fuera del árbol de React
 * (por ejemplo, desde listeners de sesión en el layout raíz).
 */
export const toastBus = {
    show(title: string, message?: string, options?: ToastOptions) {
        busShow?.(title, message, options);
    },
};

const VARIANTS: Record<ToastVariant, { icon: typeof Info; color: string; bubble: string }> = {
    success: { icon: CheckCircle2, color: "#4ade80", bubble: "bg-primary/15" },
    error: { icon: AlertCircle, color: "#f87171", bubble: "bg-destructive/15" },
    info: { icon: Info, color: "#94a3b8", bubble: "bg-secondary" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<ToastState | null>(null);
    const insets = useSafeAreaInsets();
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-24)).current;
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hide = useCallback(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -24, duration: 160, useNativeDriver: true }),
        ]).start(() => setToast(null));
    }, [opacity, translateY]);

    const show = useCallback(
        (title: string, message?: string, options?: ToastOptions) => {
            if (timer.current) clearTimeout(timer.current);
            setToast({ id: Date.now(), title, message, variant: options?.variant ?? "info" });
            opacity.setValue(0);
            translateY.setValue(-24);
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
                Animated.spring(translateY, { toValue: 0, friction: 8, useNativeDriver: true }),
            ]).start();
            timer.current = setTimeout(hide, options?.duration ?? 3200);
        },
        [hide, opacity, translateY]
    );

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    useEffect(() => {
        busShow = show;
        return () => {
            busShow = null;
        };
    }, [show]);

    const variant = toast ? VARIANTS[toast.variant] : null;
    const Icon = variant?.icon ?? Info;

    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            {toast && variant && (
                <View
                    pointerEvents="box-none"
                    className="absolute top-0 left-0 right-0 z-50 px-4"
                    style={{ paddingTop: insets.top + 8 }}
                >
                    <Animated.View
                        style={{ opacity, transform: [{ translateY }] }}
                        className="bg-card border border-border rounded-2xl px-4 py-3 flex-row items-center gap-3 shadow-lg shadow-black/40"
                    >
                        <View className={`w-9 h-9 rounded-xl items-center justify-center ${variant.bubble}`}>
                            <Icon size={18} color={variant.color} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-sm font-semibold text-foreground">{toast.title}</Text>
                            {toast.message ? <Text className="text-xs text-muted-foreground mt-0.5">{toast.message}</Text> : null}
                        </View>
                        <Pressable onPress={hide} hitSlop={8} className="w-6 h-6 items-center justify-center active:opacity-60">
                            <X size={14} color="#94a3b8" />
                        </Pressable>
                    </Animated.View>
                </View>
            )}
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>.");
    return ctx;
}
