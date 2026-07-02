import logoSrc from "@/assets/logo.png";
import { Image } from "react-native";
export default function Logo({ size = 28 }: { size?: number }) {
    return <Image source={logoSrc} alt="EasyCount logo" style={{ width: size, height: size }} className="rounded-xl object-contain shrink-0" />;
}
