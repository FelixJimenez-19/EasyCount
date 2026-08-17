import Constants from "expo-constants";

const getDevHost = (): string => {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) return hostUri.split(":")[0];
    return "localhost";
};

const DEFAULT_PORT = 4000;

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${getDevHost()}:${DEFAULT_PORT}/api`;

console.log("[EasyCount] API base URL:", API_URL);
