import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { API_BASE_URL } from "../../config/api";
import { getToken } from "../../utils/auth";

export default function ProductCard({
  product,
  onPress,
  onWishlistToggle,
  isWishlisted = false,
  style,
}) {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const title = product.title || product.name || "Sneaker Shoe";
  const brand = product.brand || "Kickz";
  const price = product.extracted_price || product.price || 99;
  const rating = product.rating || 4.5;
  const reviews = product.reviews || 0;
  const imageUrl =
    product.thumbnail ||
    product.img ||
    (Array.isArray(product.img) ? product.img[0] : null) ||
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff";

  const handleToggleWishlist = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Login Required", "Please log in to save items to your wishlist.");
        return;
      }

      setWishlistLoading(true);
      const newStatus = !wishlisted;
      setWishlisted(newStatus);

      if (newStatus) {
        await fetch(`${API_BASE_URL}/api/wishlist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: product._id }),
        });
      } else {
        await fetch(`${API_BASE_URL}/api/wishlist/${product._id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (onWishlistToggle) {
        onWishlistToggle(product._id, newStatus);
      }
    } catch (_e) {
      // Revert on error
      setWishlisted(!wishlisted);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress && onPress(product)}
      style={[styles.card, style]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="contain"
          transition={250}
          cachePolicy="memory-disk"
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleToggleWishlist}
          disabled={wishlistLoading}
          style={styles.heartButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={wishlisted ? "heart" : "heart-outline"}
            size={18}
            color={wishlisted ? theme.colors.black : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.brand} numberOfLines={1}>
          {brand.toUpperCase()}
        </Text>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.price}>
            ${Number(price).toFixed(2).replace(/\.00$/, "")}
          </Text>

          {rating ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color={theme.colors.black} />
              <Text style={styles.ratingText}>
                {Number(rating).toFixed(1)} {reviews > 0 ? `(${reviews})` : ""}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    width: "48%",
    marginBottom: theme.spacing.md,
  },
  imageContainer: {
    width: "100%",
    height: 150,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: 10,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 12,
  },
  brand: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
    lineHeight: 18,
    minHeight: 36,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.text,
  },
});
