import { useEffect, useRef, useState } from "react";
import { Text, type TextProps } from "react-native";

interface CountUpProps extends TextProps {
    value: number;
    duration?: number;
    format?: (value: number) => string;
}

/**
 * Anima un número hacia su nuevo valor (efecto "NumberTicker").
 * El estado vive en este componente, así que solo él se re-renderiza
 * en cada frame, sin afectar a la pantalla que lo contiene.
 */
export default function CountUp({ value, duration = 600, format = (v) => v.toFixed(2), ...props }: CountUpProps) {
    const [display, setDisplay] = useState(value);
    const currentRef = useRef(value);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        const from = currentRef.current;
        const to = value;
        if (from === to) return;

        const start = Date.now();
        const tick = () => {
            const t = Math.min((Date.now() - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            const next = from + (to - from) * eased;
            currentRef.current = next;
            setDisplay(next);
            if (t < 1) {
                frameRef.current = requestAnimationFrame(tick);
            } else {
                currentRef.current = to;
                setDisplay(to);
            }
        };

        frameRef.current = requestAnimationFrame(tick);
        return () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        };
    }, [value, duration]);

    return <Text {...props}>{format(display)}</Text>;
}
