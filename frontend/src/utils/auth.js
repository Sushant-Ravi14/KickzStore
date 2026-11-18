import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

const setItem = async (key, value) => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {
    await AsyncStorage.setItem(key, value).catch(() => {});
  }
};

const getItem = async (key) => {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(key);
    }
    const val = await SecureStore.getItemAsync(key);
    if (val !== null && val !== undefined) return val;
    return await AsyncStorage.getItem(key);
  } catch {
    return await AsyncStorage.getItem(key).catch(() => null);
  }
};

const removeItem = async (key) => {
  try {
    if (isWeb) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
    await AsyncStorage.removeItem(key).catch(() => {});
  } catch {
    await AsyncStorage.removeItem(key).catch(() => {});
  }
};

export const saveToken = async (token) => {
  await setItem("authToken", token);
};

export const getToken = async () => {
  return await getItem("authToken");
};

export const removeToken = async () => {
  await removeItem("authToken");
};

export const saveRefreshToken = async (refreshToken) => {
  await setItem("refreshToken", refreshToken);
};

export const getRefreshToken = async () => {
  return await getItem("refreshToken");
};

export const removeRefreshToken = async () => {
  await removeItem("refreshToken");
};

export const clearAuth = async () => {
  await Promise.all([
    removeItem("authToken"),
    removeItem("refreshToken"),
    removeItem("authUser"),
  ]);
};

export default {
  saveToken,
  getToken,
  removeToken,
  saveRefreshToken,
  getRefreshToken,
  removeRefreshToken,
  clearAuth,
};
