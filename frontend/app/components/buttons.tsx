import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";

type Variant = "primary" | "outline" | "destructive" | "tab";
type Size = "md" | "lg" | "xl";

const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

const VARIANTS: Record<Exclude<Variant, "tab">, { container: string; label: string; icon: string }> = {
    primary: {
        container: "bg-primary",
        label: "text-primary-foreground   font-semibold",
        icon: "#0f172a",
    },
    outline: {
        container: "border border-border",
        label: "text-muted-foreground font-medium",
        icon: "#94a3b8",
    },
    destructive: {
        container: "bg-destructive/10",
        label: "text-destructive font-semibold",
        icon: "#f87171",
    },
};

const TAB = {
    container: "flex-col items-center gap-1 py-1.5 px-4 ",
    iconBox: "w-10 h-10  items-center justify-center",
    iconBoxActive: "bg-primary/15 rounded-2xl",
    iconBoxInactive: "bg-transparent",
    icon: { active: "#4ade80", inactive: "#f1f5f9" },
    label: { active: "text-primary", inactive: "text-foreground" },
    labelClass: "text-[10px] font-medium leading-none",
    iconSize: 22,
};

const SIZES: Record<Size, { container: string; icon: number }> = {
    md: { container: "py-2.5 px-4 rounded-xl", icon: 16 },
    lg: { container: "py-3.5 px-4 rounded-2xl", icon: 18 },
    xl: { container: "py-4 px-5 rounded-2xl", icon: 20 },
};

interface ButtonProps extends Omit<PressableProps, "children"> {
    variant?: Variant;
    size?: Size;
    label?: string;
    icon?: LucideIcon | null;
    iconLeft?: boolean;
    active?: boolean;
    className?: string;
    classIcon?: string;
    children?: ReactNode;
}

export default function Button({
    variant = "primary",
    size = "lg",
    label = "",
    icon = null,
    iconLeft = true,
    active = false,
    className = "",
    classIcon = "",
    children,
    ...props
}: ButtonProps) {
    if (variant === "tab") {
        return (
            <Pressable className={cn(TAB.container, className)} {...props}>
                <View className={cn(TAB.iconBox, active ? TAB.iconBoxActive : TAB.iconBoxInactive)}>
                    {icon ? (
                        <Icon icon={icon} size={TAB.iconSize} color={active ? TAB.icon.active : TAB.icon.inactive} className={classIcon} />
                    ) : null}
                </View>
                {label ? <Text className={cn(TAB.labelClass, active ? TAB.label.active : TAB.label.inactive)}>{label}</Text> : null}
                {children}
            </Pressable>
        );
    }

    const v = VARIANTS[variant];
    const s = SIZES[size];

    return (
        <Pressable className={cn("flex-row items-center justify-center gap-2 active:opacity-80", v.container, s.container, className)} {...props}>
            {iconLeft && icon ? <Icon icon={icon} size={s.icon} color={v.icon} className={classIcon} /> : null}
            {label ? <Text className={cn(v.label, "text-sm")}>{label}</Text> : null}
            {!iconLeft && icon ? <Icon icon={icon} size={s.icon} color={v.icon} className={classIcon} /> : null}
            {children}
        </Pressable>
    );
}

function Icon({ icon: IconComponent, size, color, className = "" }: { icon: LucideIcon; size: number; color: string; className?: string }) {
    return <IconComponent size={size} color={color} className={className} />;
}
