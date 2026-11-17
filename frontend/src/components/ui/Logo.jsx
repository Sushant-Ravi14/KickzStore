import React from "react";
import { Text, StyleSheet } from "react-native";
import { theme } from "../../theme";

export default function Logo({ size = "md", color = theme.colors.text, style }) {
  const getFontSize = () => {
    switch (size) {
      case "sm":
        return 18;
      case "lg":
        return 28;
      case "xl":
        return 36;
      case "md":
      default:
        return 22;
    }
  };

  const fontSize = getFontSize();

  return (
    <Text
      style={[
        styles.logo,
        {
          fontSize,
          color,
          letterSpacing: size === "xl" ? -1.2 : -0.6,
        },
        style,
      ]}
      numberOfLines={1}
    >
      KickzStore
    </Text>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontWeight: "900",
    fontFamily: undefined,
  },
});
