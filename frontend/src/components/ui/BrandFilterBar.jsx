import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";

export default function BrandFilterBar({
  brands = [],
  selectedBrand = "All",
  onSelectBrand,
  selectedSort = "featured",
  onSelectSort,
  style,
}) {
  const sortOptions = [
    { key: "featured", label: "Featured" },
    { key: "price_asc", label: "Price: Low to High" },
    { key: "price_desc", label: "Price: High to Low" },
    { key: "brand_asc", label: "Brand: A to Z" },
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Brand Chips Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {brands.map((b) => {
          const brandName = typeof b === "string" ? b : b.name;
          const count = typeof b === "object" ? b.count : null;
          const isSelected =
            selectedBrand.toLowerCase() === brandName.toLowerCase();

          return (
            <TouchableOpacity
              key={brandName}
              activeOpacity={0.75}
              onPress={() => onSelectBrand(brandName)}
              style={[
                styles.chip,
                isSelected ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {brandName}
                {count !== null && count !== undefined ? ` (${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Quick Sort Bar if onSelectSort is provided */}
      {onSelectSort && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortScroll}
        >
          <View style={styles.sortLabelContainer}>
            <Ionicons name="swap-vertical" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.sortLabel}>Sort:</Text>
          </View>
          {sortOptions.map((opt) => {
            const isSelected = selectedSort === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.7}
                onPress={() => onSelectSort(opt.key)}
                style={[
                  styles.sortPill,
                  isSelected && styles.sortPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.sortPillText,
                    isSelected && styles.sortPillTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 10,
  },
  chipsScroll: {
    paddingHorizontal: theme.spacing.md,
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.full,
    flexDirection: "row",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: theme.colors.black,
  },
  chipInactive: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  chipTextActive: {
    color: theme.colors.white,
  },
  chipTextInactive: {
    color: theme.colors.textSecondary,
  },
  sortScroll: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 10,
    gap: 6,
    alignItems: "center",
  },
  sortLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
    gap: 4,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
  },
  sortPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: "transparent",
  },
  sortPillActive: {
    backgroundColor: theme.colors.borderLight,
  },
  sortPillText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  sortPillTextActive: {
    color: theme.colors.black,
    fontWeight: "700",
  },
});
