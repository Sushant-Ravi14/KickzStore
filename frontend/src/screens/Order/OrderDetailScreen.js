import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
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
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import ErrorState from "../../components/ui/ErrorState";

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId, order: initialOrder } = route.params || {};
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("You are not authenticated");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/orders/detail/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setOrder(data.order || data);
      } else {
        throw new Error("Could not find order details");
      }
    } catch (err) {
      setError(err.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? Any payment deduction will be refunded to your balance.",
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Cancel Order",
          style: "destructive",
          onPress: async () => {
            setIsCancelling(true);
            try {
              const token = await getToken();
              const res = await fetch(
                `${API_BASE_URL}/api/orders/${orderId}/cancel`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                  },
                }
              );
              const data = await res.json();
              if (res.ok) {
                Alert.alert("Order Cancelled", "Your order has been cancelled and stock returned.");
                fetchOrderDetail();
              } else {
                Alert.alert("Cannot Cancel", data.message || "Order cannot be cancelled.");
              }
            } catch (err) {
              Alert.alert("Error", err.message || "Network error.");
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack={true} navigation={navigation} title="Order Details" />
        <Loader message="Loading order details..." />
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack={true} navigation={navigation} title="Order Details" />
        <ErrorState
          title="Order Not Found"
          message={error || "Could not retrieve order details."}
          onRetry={fetchOrderDetail}
        />
      </SafeAreaView>
    );
  }

  const items = order.items || order.products || [];
  const status = (order.status || "Processing").toLowerCase();
  const isCancellable = status === "pending" || status === "processing";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Header
        showBack={true}
        navigation={navigation}
        title={`ORDER #${String(order._id).slice(-6).toUpperCase()}`}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View>
              <Text style={styles.statusLabel}>Current Status</Text>
              <Text style={styles.statusValue}>{order.status?.toUpperCase() || "PROCESSING"}</Text>
            </View>
            <View style={styles.statusIconCircle}>
              <Ionicons
                name={status === "delivered" ? "checkmark-circle" : "cube-outline"}
                size={24}
                color={theme.colors.black}
              />
            </View>
          </View>
          {order.createdAt && (
            <Text style={styles.dateText}>
              Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </Card>

        {/* Ordered Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDERED ITEMS ({items.length})</Text>
          {items.map((it, idx) => {
            const p = it.product || it.productId || {};
            const title = p.title || p.name || it.name || "Sneaker Shoe";
            const imageUrl =
              p.thumbnail ||
              p.img ||
              (Array.isArray(p.img) ? p.img[0] : null) ||
              "https://images.unsplash.com/photo-1542291026-7eec264c27ff";

            return (
              <Card key={idx} style={styles.itemCard}>
                <Image source={{ uri: imageUrl }} style={styles.itemImage} contentFit="contain" />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  <Text style={styles.itemVariant}>
                    Size: {it.size || "42"}  •  Color: {it.color || "Black"}  •  Qty: {it.quantity || 1}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ${(Number(it.price || p.price || 99) * Number(it.quantity || 1)).toFixed(2).replace(/\.00$/, "")}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DELIVERY ADDRESS</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={theme.colors.black} />
              <Text style={styles.addressText}>{order.address || "Standard Customer Address"}</Text>
            </View>
          </Card>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={18} color={theme.colors.black} />
              <Text style={styles.addressText}>
                {order.paymentMethod === "credit_card"
                  ? "Simulated Payment Card (Verified)"
                  : order.paymentMethod === "cod"
                  ? "Cash on Delivery"
                  : "Electronic Payment"}
              </Text>
            </View>
          </Card>
        </View>

        {/* Cost Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT SUMMARY</Text>
          <Card style={styles.summaryCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Items Total</Text>
              <Text style={styles.priceVal}>
                ${Number(order.totalAmount || order.total || 0).toFixed(2).replace(/\.00$/, "")}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Shipping</Text>
              <Text style={styles.priceVal}>
                {order.shippingFee ? `$${order.shippingFee.toFixed(2)}` : "FREE"}
              </Text>
            </View>
            {order.voucherCode ? (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Voucher Applied</Text>
                <Text style={[styles.priceVal, { color: theme.colors.success }]}>
                  {order.voucherCode}
                </Text>
              </View>
            ) : null}
            <View style={styles.summaryDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalVal}>
                ${Number(order.totalAmount || order.total || 0).toFixed(2).replace(/\.00$/, "")}
              </Text>
            </View>
          </Card>
        </View>

        {/* Cancel Order Action if eligible */}
        {isCancellable && (
          <View style={styles.actionContainer}>
            <Button
              title="Cancel Order"
              variant="danger"
              size="lg"
              loading={isCancelling}
              onPress={handleCancelOrder}
            />
          </View>
        )}
      </ScrollView>
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
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 24,
  },
  statusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    padding: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.sm,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 14,
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
  itemPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.text,
    marginTop: 4,
  },
  infoCard: {
    padding: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addressText: {
    fontSize: 13,
    color: theme.colors.text,
    flex: 1,
    lineHeight: 18,
  },
  summaryCard: {
    padding: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  priceVal: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
  },
  actionContainer: {
    marginTop: 10,
  },
});
