import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "react-native-reanimated";
import { QueryClientProvider } from "@tanstack/react-query";

import queryClient from "@/src/api/queryClient";
import ErrorBoundary from "@/src/components/common/ErrorBoundary";

const MinimalistTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#FFFFFF",
    card: "#FFFFFF",
    text: "#000000",
    border: "#EEEEEE",
    primary: "#000000",
  },
};

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={MinimalistTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
          </Stack>
          <StatusBar style="dark" backgroundColor="#FFFFFF" />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
