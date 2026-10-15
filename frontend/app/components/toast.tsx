import { AlertCircle, CheckCircle2, Info, type LucideIcon } from "lucide-react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info";

interface ToastOptions {
    message: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContextValue {
    show: (options: ToastOptions) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3000;
const ANIMATION_DURATION = 220;

const VARIANTS: Record<ToastType, { container: string; text: string; icon: LucideIcon; iconColor: string }> = {
    success: { container: "bg-primary/10 border-primary/20", text: "text-primary", icon: CheckCircle2, iconColor: "#4ade80" },
    error: { container: "bg-destructive/10 border-destructive/20", text: "text-destructive", icon: AlertCircle, iconColor: "#f87171" },
    info: { container: "bg-card border-border", text: "text-foreground", icon: Info, iconColor: "#94a3b8" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const insets = useSafeAreaInsets();
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const progress = useRef(new Animated.Value(0)).current;
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
    }, []);

    const hide = useCallback(() => {
        clearTimer();
        Animated.timing(progress, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) setToast(null);
        });
    }, [clearTimer, progress]);

    const show = useCallback(
        (options: ToastOptions) => {
            const { message, type = "info", duration = DEFAULT_DURATION } = options;
            clearTimer();
            setToast({ message, type });
            progress.stopAnimation();
            progress.setValue(0);
            Animated.timing(progress, {
                toValue: 1,
                duration: ANIMATION_DURATION,
                useNativeDriver: true,
            }).start();
            timer.current = setTimeout(hide, duration);
        },
        [clearTimer, hide, progress]
    );

    useEffect(() => clearTimer, [clearTimer]);

    const value = useMemo<ToastContextValue>(
        () => ({
            show,
            success: (message, duration) => show({ message, type: "success", duration }),
            error: (message, duration) => show({ message, type: "error", duration }),
            info: (message, duration) => show({ message, type: "info", duration }),
        }),
        [show]
    );

    const variant = toast ? VARIANTS[toast.type] : null;

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toast && variant ? (
                <Animated.View
                    pointerEvents="none"
                    style={{
                        position: "absolute",
                        top: insets.top + 8,
                        left: 16,
                        right: 16,
                        opacity: progress,
                        transform: [
                            {
                                translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }),
                            },
                        ],
                    }}
                    className={`flex-row items-center gap-x-3 rounded-2xl border px-4 py-3 shadow-lg shadow-black/30 ${variant.container}`}
                >
                    <variant.icon size={18} color={variant.iconColor} />
                    <View className="flex-1">
                        <Text className={`text-sm font-medium ${variant.text}`}>{toast.message}</Text>
                    </View>
                </Animated.View>
            ) : null}
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast debe usarse dentro de <ToastProvider>.");
    }
    return context;
}
