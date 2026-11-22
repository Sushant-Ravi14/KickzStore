import React, { useState, useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { API_BASE_URL } from "../../config/api";
import { getToken } from "../../utils/auth";
import Header from "../../components/ui/Header";
import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";

export default function OrderListScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setIsLoggedIn(false);
        setOrders([]);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn("Orders fetch notice:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "delivered":
        return { bg: theme.colors.successLight, text: theme.colors.success };
      case "cancelled":
        return { bg: theme.colors.errorLight, text: theme.colors.error };
      case "shipping":
      case "shipped":
        return { bg: "#E3F2FD", text: "#0D47A1" };
      default:
        return { bg: theme.colors.surfaceSubtle, text: theme.colors.textSecondary };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="My Orders"
        subtitle={orders.length ? `${orders.length} orders on record` : undefined}
      />

      {loading && !refreshing ? (
        <Loader message="Loading your order history..." />
      ) : !isLoggedIn ? (
        <EmptyState
          icon="receipt-outline"
          title="Sign in for Orders"
          message="Sign in to view your orders and track deliveries."
          actionLabel="Sign In"
          onAction={() => navigation.navigate("Login")}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No Orders Yet"
          message="When you place orders, they will appear here with live tracking updates."
          actionLabel="Explore Shoes"
          onAction={() => navigation.navigate("Home")}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.black}
            />
          }
          renderItem={({ item }) => {
            const statusStyle = getStatusColor(item.status);
            const dateStr = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recent";

            return (
              <Card
                style={styles.orderCard}
                onPress={() => navigation.navigate("OrderDetail", { orderId: item._id, order: item })}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderIdText}>
                      ORDER #{String(item._id).slice(-6).toUpperCase()}
                    </Text>
                    <Text style={styles.orderDate}>{dateStr}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: statusStyle.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: statusStyle.text },
                      ]}
                    >
                      {item.status || "Processing"}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.itemsSummary}>
                  <Text style={styles.itemsCountText}>
                    {item.items?.length || 1} item{item.items?.length === 1 ? "" : "s"}
                  </Text>
                  <Text style={styles.orderTotal}>
                    ${Number(item.totalAmount || item.total || 0).toFixed(2).replace(/\.00$/, "")}
                  </Text>
                </View>

                <View style={styles.viewRow}>
                  <Text style={styles.viewDetailsText}>View Order Details</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                </View>
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  orderCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  orderDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: 12,
  },
  itemsSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemsCountText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  viewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
});
