import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { API_BASE_URL } from "../../config/api";
import { getToken } from "../../utils/auth";
import Header from "../../components/ui/Header";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";

export default function ProductDetailScreen({ route, navigation }) {
  const { item } = route.params || {};
  const [product, setProduct] = useState(item || null);
  const [loading, setLoading] = useState(!item);
  const [selectedSize, setSelectedSize] = useState(42);
  const [selectedColor, setSelectedColor] = useState("Black");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const productId = item?._id || item?.serpapiId || route.params?.id;

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          if (data.size && data.size.length > 0) {
            setSelectedSize(data.size[0]);
          }
          if (data.color && data.color.length > 0) {
            setSelectedColor(data.color[0]);
          }
        }
      } catch (err) {
        console.warn("Product detail fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [productId]);

  const handleToggleWishlist = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Login Required", "Please log in to save to your wishlist.");
        navigation.navigate("Login");
        return;
      }

      const nextStatus = !isWishlisted;
      setIsWishlisted(nextStatus);

      if (nextStatus) {
        await fetch(`${API_BASE_URL}/api/wishlist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: product?._id || productId }),
        });
      } else {
        await fetch(`${API_BASE_URL}/api/wishlist/${product?._id || productId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (_e) {
      setIsWishlisted(!isWishlisted);
    }
  };

  const handleAddToCart = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Login Required", "Please log in to add items to your cart.", [
          { text: "Sign In", onPress: () => navigation.navigate("Login") },
          { text: "Cancel", style: "cancel" },
        ]);
        return;
      }

      setIsAddingToCart(true);

      const res = await fetch(`${API_BASE_URL}/api/carts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product?._id || productId,
          quantity: 1,
          size: selectedSize,
          color: selectedColor,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Added to Bag", `${product?.name || "Shoe"} has been added to your shopping bag.`, [
          { text: "Go to Bag", onPress: () => navigation.navigate("MainMenu", { screen: "Cart" }) },
          { text: "Continue Shopping", style: "cancel" },
        ]);
      } else {
        Alert.alert("Notice", data.message || "Failed to add product to cart.");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Unable to connect to server.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack={true} navigation={navigation} title="Sneaker Detail" />
        <Loader message="Loading sneaker details..." />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack={true} navigation={navigation} title="Sneaker Detail" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Sneaker not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

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

  const availableSizes =
    product.size && product.size.length > 0
      ? product.size
      : [39, 40, 41, 42, 43, 44];

  const availableColors =
    product.color && product.color.length > 0
      ? product.color
      : ["Black", "White", "Grey"];

  const rightHeaderAction = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleToggleWishlist}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={isWishlisted ? "heart" : "heart-outline"}
        size={24}
        color={theme.colors.black}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Header
        showBack={true}
        navigation={navigation}
        title={brand.toUpperCase()}
        rightAction={rightHeaderAction}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image Stage */}
        <View style={styles.imageStage}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.mainImage}
            contentFit="contain"
            transition={300}
            cachePolicy="memory-disk"
          />
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.brandSubtitle}>{brand.toUpperCase()}</Text>
              <Text style={styles.productTitle}>{title}</Text>
            </View>
            <Text style={styles.priceText}>
              ${Number(price).toFixed(2).replace(/\.00$/, "")}
            </Text>
          </View>

          {/* Rating & Reviews */}
          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons
                  key={s}
                  name={s <= Math.round(rating) ? "star" : "star-outline"}
                  size={14}
                  color={theme.colors.black}
                />
              ))}
            </View>
            <Text style={styles.ratingNumber}>
              {Number(rating).toFixed(1)} {reviews > 0 ? `(${reviews} reviews)` : ""}
            </Text>
            {product.source ? (
              <Text style={styles.sourceBadge}>via {product.source}</Text>
            ) : null}
          </View>

          <View style={styles.divider} />

          {/* Size Selector */}
          <View style={styles.selectorSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Select Size (EU)</Text>
              <Text style={styles.sectionValue}>Size {selectedSize}</Text>
            </View>
            <View style={styles.chipsGrid}>
              {availableSizes.map((sz) => {
                const isSelected = selectedSize === sz;
                return (
                  <TouchableOpacity
                    key={sz}
                    activeOpacity={0.75}
                    onPress={() => setSelectedSize(sz)}
                    style={[
                      styles.sizeChip,
                      isSelected && styles.sizeChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sizeChipText,
                        isSelected && styles.sizeChipTextSelected,
                      ]}
                    >
                      {sz}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Color Selector */}
          <View style={styles.selectorSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Select Colorway</Text>
              <Text style={styles.sectionValue}>{selectedColor}</Text>
            </View>
            <View style={styles.chipsGrid}>
              {availableColors.map((col) => {
                const isSelected = selectedColor === col;
                return (
                  <TouchableOpacity
                    key={col}
                    activeOpacity={0.75}
                    onPress={() => setSelectedColor(col)}
                    style={[
                      styles.colorChip,
                      isSelected && styles.colorChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.colorChipText,
                        isSelected && styles.colorChipTextSelected,
                      ]}
                    >
                      {col}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionLabel}>About This Footwear</Text>
            <Text style={styles.descriptionText}>
              {product.description ||
                `${title} combines authentic heritage sneaker design with modern performance cushioning. Crafted with premium upper materials and engineered traction.`}
            </Text>
          </View>

          {/* Guarantee Badges */}
          <Card style={styles.badgeCard}>
            <View style={styles.badgeRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.black} />
              <Text style={styles.badgeText}>100% Verified Authentic Footwear</Text>
            </View>
            <View style={[styles.badgeRow, { marginTop: 8 }]}>
              <Ionicons name="repeat-outline" size={18} color={theme.colors.black} />
              <Text style={styles.badgeText}>30-Day Easy Exchange Policy</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceContainer}>
          <Text style={styles.bottomPriceLabel}>Total Price</Text>
          <Text style={styles.bottomPriceValue}>
            ${Number(price).toFixed(2).replace(/\.00$/, "")}
          </Text>
        </View>

        <Button
          title={isAddingToCart ? "Adding to Bag..." : "Add to Bag"}
          loading={isAddingToCart}
          onPress={handleAddToCart}
          variant="primary"
          size="lg"
          style={styles.addButton}
          icon={<Ionicons name="bag-handle-outline" size={18} color={theme.colors.white} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageStage: {
    width: "100%",
    height: 300,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  infoSection: {
    padding: theme.spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  priceText: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  ratingNumber: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  sourceBadge: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 20,
  },
  selectorSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  sectionValue: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sizeChip: {
    minWidth: 54,
    height: 44,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  sizeChipSelected: {
    backgroundColor: theme.colors.black,
    borderColor: theme.colors.black,
  },
  sizeChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  sizeChipTextSelected: {
    color: theme.colors.white,
  },
  colorChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  colorChipSelected: {
    backgroundColor: theme.colors.black,
    borderColor: theme.colors.black,
  },
  colorChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
  },
  colorChipTextSelected: {
    color: theme.colors.white,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginTop: 8,
  },
  badgeCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.text,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 16,
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
  },
  bottomPriceValue: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  addButton: {
    flex: 1.5,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
