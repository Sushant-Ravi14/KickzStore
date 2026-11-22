import React, { useState, useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { theme } from "../../theme";
import { API_BASE_URL } from "../../config/api";
import { getToken } from "../../utils/auth";
import Header from "../../components/ui/Header";
import ProductCard from "../../components/ui/ProductCard";
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";

export default function WishlistScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState(null);

  const fetchWishlist = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        setIsLoggedIn(false);
        setItems([]);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      const res = await fetch(`${API_BASE_URL}/api/wishlist/mine`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.wishlist || []);
      } else {
        // Try fallback route
        const allRes = await fetch(`${API_BASE_URL}/api/wishlist`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (allRes.ok) {
          const allData = await allRes.json();
          setItems(Array.isArray(allData) ? allData : []);
        } else {
          setItems([]);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [fetchWishlist])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchWishlist();
  };

  const handleProductPress = (product) => {
    navigation.navigate("ProductDetail", { item: product });
  };

  const handleWishlistToggle = (productId, isAdded) => {
    if (!isAdded) {
      setItems((prev) => prev.filter((p) => p._id !== productId));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Wishlist"
        subtitle={items.length ? `${items.length} saved item${items.length === 1 ? "" : "s"}` : undefined}
      />

      {loading && !refreshing ? (
        <Loader message="Loading your saved sneakers..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchWishlist} />
      ) : !isLoggedIn ? (
        <EmptyState
          icon="heart-outline"
          title="Sign in for Wishlist"
          message="Sign in to save sneakers you love and access them across devices."
          actionLabel="Sign In"
          onAction={() => navigation.navigate("Login")}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Your Wishlist is Empty"
          message="Explore the collection and tap the heart icon on any pair to save it here."
          actionLabel="Explore Shoes"
          onAction={() => navigation.navigate("Home")}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.black}
            />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              isWishlisted={true}
              onPress={handleProductPress}
              onWishlistToggle={handleWishlistToggle}
            />
          )}
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
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
});
