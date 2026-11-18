import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Automatically resolves the backend API Base URL based on execution environment.
 * Prioritizes EXPO_PUBLIC_API_URL, then dynamically detects host LAN IP via Expo Constants.
 */
const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const expoHostIp = hostUri ? hostUri.split(":")[0] : null;

  if (process.env.EXPO_PUBLIC_API_URL) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
    // If on a physical mobile device or emulator, rewrite localhost to detected expo host IP
    if (Platform.OS !== "web" && (envUrl.includes("localhost") || envUrl.includes("127.0.0.1"))) {
      const targetIp = expoHostIp || "192.168.29.99";
      return envUrl.replace(/localhost|127\.0\.0\.1/, targetIp);
    }
    return envUrl;
  }

  if (Platform.OS === "web") {
    return "http://localhost:5001";
  }

  // If connected via Expo Go on physical device
  if (expoHostIp) {
    return `http://${expoHostIp}:5001`;
  }

  // Fallback for Android emulator
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5001";
  }

  return "http://192.168.29.99:5001";
};

export const API_BASE_URL = getBaseUrl();
export default API_BASE_URL;
