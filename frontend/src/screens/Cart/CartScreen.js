import React, { useState, useCallback, memo } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { API_BASE_URL } from "../../config/api";
import { getToken } from "../../utils/auth";
import Header from "../../components/ui/Header";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";

const CartItemRow = memo(({ item, isSelected, onToggleSelect, onUpdateQty, onRemove }) => {
  const product = item.productId || {};
  const title = product.title || product.name || "Sneaker Shoe";
  const brand = product.brand || "Kickz";
  const price = product.extracted_price || product.price || 99;
  const imageUrl =
    product.thumbnail ||
    product.img ||
    (Array.isArray(product.img) ? product.img[0] : null) ||
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff";

  return (
    <Card style={styles.cartCard}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggleSelect(item)}
          style={styles.checkboxTouch}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
            {isSelected && <Ionicons name="checkmark" size={14} color={theme.colors.white} />}
          </View>
        </TouchableOpacity>

        <View style={styles.cardInfo}>
          <Text style={styles.itemBrand}>{brand.toUpperCase()}</Text>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.itemVariant}>
            Size: {item.size || "42"}  •  Color: {item.color || "Black"}
          </Text>
        </View>

        <Image
          source={{ uri: imageUrl }}
          style={styles.itemImage}
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
        />
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.itemPrice}>
          ${(Number(price) * Number(item.quantity || 1)).toFixed(2).replace(/\.00$/, "")}
        </Text>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => onUpdateQty(product._id, (item.quantity || 1) - 1, item.size, item.color)}
            style={styles.stepperButton}
          >
            <Ionicons name="remove" size={14} color={theme.colors.black} />
          </TouchableOpacity>

          <Text style={styles.stepperValue}>{item.quantity}</Text>

          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => onUpdateQty(product._id, (item.quantity || 1) + 1, item.size, item.color)}
            style={styles.stepperButton}
          >
            <Ionicons name="add" size={14} color={theme.colors.black} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => onRemove(product._id, item.size, item.color)}
            style={styles.removeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
});
CartItemRow.displayName = "CartItemRow";

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const getKey = (item) => `${item.productId?._id}-${item.size}-${item.color}`;

  const fetchCart = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setIsLoggedIn(false);
        setCartItems([]);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      const res = await fetch(`${API_BASE_URL}/api/carts`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const items = data.products || [];
        setCartItems(items);

        // Select all by default
        const allKeys = new Set(items.map((it) => `${it.productId?._id}-${it.size}-${it.color}`));
        setSelectedKeys(allKeys);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.warn("Cart fetch notice:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [fetchCart])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCart();
  };

  const handleToggleSelect = (item) => {
    const k = getKey(item);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) {
        next.delete(k);
      } else {
        next.add(k);
      }
      return next;
    });
  };

  const handleUpdateQty = async (productId, newQty, size, color) => {
    if (newQty < 1) {
      handleRemoveItem(productId, size, color);
      return;
    }

    try {
      const token = await getToken();
      await fetch(`${API_BASE_URL}/api/carts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: newQty, size, color }),
      });
      fetchCart();
    } catch (_e) {}
  };

  const handleRemoveItem = async (productId, size, color) => {
    Alert.alert("Remove Item", "Remove this sneaker from your shopping bag?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getToken();
            await fetch(`${API_BASE_URL}/api/carts`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ productId, size, color }),
            });
            fetchCart();
          } catch (_e) {}
        },
      },
    ]);
  };

  const selectedProducts = cartItems.filter((it) =>
    selectedKeys.has(getKey(it))
  );

  const subtotal = selectedProducts.reduce((sum, it) => {
    const p = it.productId?.extracted_price || it.productId?.price || 99;
    return sum + Number(p) * Number(it.quantity || 1);
  }, 0);

  const handleCheckout = () => {
    if (selectedProducts.length === 0) {
      Alert.alert("Select Items", "Please select at least one sneaker to check out.");
      return;
    }

    navigation.navigate("Checkout", {
      selectedItems: selectedProducts,
      subtotal,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Header
        title="Shopping Bag"
        subtitle={cartItems.length ? `${cartItems.length} item${cartItems.length === 1 ? "" : "s"}` : undefined}
      />

      {loading && !refreshing ? (
        <Loader message="Loading your bag..." />
      ) : !isLoggedIn ? (
        <EmptyState
          icon="bag-handle-outline"
          title="Sign in for Bag"
          message="Sign in to view your bag, saved items, and complete orders."
          actionLabel="Sign In"
          onAction={() => navigation.navigate("Login")}
        />
      ) : cartItems.length === 0 ? (
        <EmptyState
          icon="bag-handle-outline"
          title="Your Bag is Empty"
          message="Explore our collection and add your favorite pairs to the bag."
          actionLabel="Explore Shoes"
          onAction={() => navigation.navigate("Home")}
        />
      ) : (
        <View style={styles.container}>
          <FlatList
            data={cartItems}
            keyExtractor={getKey}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.black}
              />
            }
            renderItem={({ item }) => (
              <CartItemRow
                item={item}
                isSelected={selectedKeys.has(getKey(item))}
                onToggleSelect={handleToggleSelect}
                onUpdateQty={handleUpdateQty}
                onRemove={handleRemoveItem}
              />
            )}
          />

          {/* Sticky Checkout Summary Footer */}
          <View style={styles.summaryFooter}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Subtotal ({selectedProducts.length} items)</Text>
                <Text style={styles.summarySubtext}>Shipping and taxes calculated at checkout</Text>
              </View>
              <Text style={styles.summaryTotal}>
                ${subtotal.toFixed(2).replace(/\.00$/, "")}
              </Text>
            </View>

            <Button
              title={`Checkout • $${subtotal.toFixed(2).replace(/\.00$/, "")}`}
              onPress={handleCheckout}
              disabled={selectedProducts.length === 0}
              variant="primary"
              size="lg"
              style={styles.checkoutButton}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 24,
  },
  cartCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkboxTouch: {
    paddingRight: 10,
    paddingTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: theme.colors.black,
    borderColor: theme.colors.black,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 10,
  },
  itemBrand: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    lineHeight: 18,
  },
  itemVariant: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  itemImage: {
    width: 70,
    height: 70,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceSubtle,
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    marginLeft: 10,
    padding: 4,
  },
  summaryFooter: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  summarySubtext: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  checkoutButton: {
    width: "100%",
  },
});
