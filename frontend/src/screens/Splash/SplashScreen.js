import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, StatusBar } from "react-native";
import * as ExpoSplashScreen from "expo-splash-screen";
import { theme } from "../../theme";
import Logo from "../../components/ui/Logo";
import { getToken } from "../../utils/auth";

// Keep native splash screen visible while loading resources
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function SplashScreen({ navigation }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide native splash screen and trigger spring + fade-in animation
    const runAnimation = async () => {
      try {
        await ExpoSplashScreen.hideAsync();
      } catch (_e) {}

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]).start(async () => {
        // After subtle pop-up finishes, determine initial destination based on auth state
        setTimeout(async () => {
          try {
            const token = await getToken();
            if (token) {
              navigation.replace("MainMenu");
            } else {
              navigation.replace("MainMenu");
            }
          } catch (_e) {
            navigation.replace("MainMenu");
          }
        }, 500);
      });
    };

    runAnimation();
  }, [navigation, scaleAnim, opacityAnim]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Logo size="xl" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
