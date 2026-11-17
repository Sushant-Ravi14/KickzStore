import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { theme } from "../../theme";

export default function Button({
  title,
  onPress,
  variant = "primary", // primary | secondary | outline | ghost | danger
  size = "md", // sm | md | lg
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  fullWidth = true,
  style,
  textStyle,
}) {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";
  const isDanger = variant === "danger";

  const getContainerStyle = () => {
    const base = [styles.button];

    if (fullWidth) base.push(styles.fullWidth);

    // Size
    if (size === "sm") base.push(styles.sizeSm);
    else if (size === "lg") base.push(styles.sizeLg);
    else base.push(styles.sizeMd);

    // Variant
    if (isPrimary) base.push(styles.primaryButton);
    else if (isSecondary) base.push(styles.secondaryButton);
    else if (isOutline) base.push(styles.outlineButton);
    else if (isGhost) base.push(styles.ghostButton);
    else if (isDanger) base.push(styles.dangerButton);

    if (disabled || loading) base.push(styles.disabled);

    return base;
  };

  const getTextStyle = () => {
    const base = [styles.buttonText];

    if (size === "sm") base.push(styles.textSm);
    else if (size === "lg") base.push(styles.textLg);
    else base.push(styles.textMd);

    if (isPrimary) base.push(styles.primaryText);
    else if (isSecondary) base.push(styles.secondaryText);
    else if (isOutline) base.push(styles.outlineText);
    else if (isGhost) base.push(styles.ghostText);
    else if (isDanger) base.push(styles.dangerText);

    return base;
  };

  const loaderColor = isPrimary ? theme.colors.white : theme.colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={loaderColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === "left" && (
            <View style={styles.leftIconContainer}>{icon}</View>
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === "right" && (
            <View style={styles.rightIconContainer}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
  },
  fullWidth: {
    width: "100%",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
  },
  // Sizes
  sizeSm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sizeMd: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  sizeLg: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  // Variants
  primaryButton: {
    backgroundColor: theme.colors.black,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: theme.colors.black,
  },
  ghostButton: {
    backgroundColor: "transparent",
  },
  dangerButton: {
    backgroundColor: theme.colors.errorLight,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  disabled: {
    opacity: 0.5,
  },
  // Typography
  buttonText: {
    fontWeight: "600",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  textSm: {
    fontSize: 13,
  },
  textMd: {
    fontSize: 15,
  },
  textLg: {
    fontSize: 16,
    fontWeight: "700",
  },
  primaryText: {
    color: theme.colors.white,
  },
  secondaryText: {
    color: theme.colors.text,
  },
  outlineText: {
    color: theme.colors.black,
  },
  ghostText: {
    color: theme.colors.textSecondary,
  },
  dangerText: {
    color: theme.colors.error,
  },
});
