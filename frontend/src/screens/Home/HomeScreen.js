import React, { useState, useCallback, useEffect } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { API_BASE_URL } from "../../config/api";
import Header from "../../components/ui/Header";
import BrandFilterBar from "../../components/ui/BrandFilterBar";
import ProductCard from "../../components/ui/ProductCard";
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import { FALLBACK_PRODUCTS, getFallbackBrandStats } from "../../data/fallbackProducts";

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [brands, setBrands] = useState(getFallbackBrandStats(FALLBACK_PRODUCTS));
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedSort, setSelectedSort] = useState("featured");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async (brand = selectedBrand, sort = selectedSort) => {
    try {
      setError(null);
      let url = `${API_BASE_URL}/api/products?format=full`;
      if (brand && brand.toLowerCase() !== "all") {
        url += `&brand=${encodeURIComponent(brand)}`;
      }
      if (sort && sort !== "featured") {
        url += `&sort=${encodeURIComponent(sort)}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`Failed to load shoes (${res.status})`);
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.products || [];
      const brandStats = data.brands || [];

      if (list.length > 0) {
        setProducts(list);
      }
      if (brandStats.length > 0) {
        setBrands(brandStats);
      }
    } catch (err) {
      console.warn("Product load notice:", err.message);
      // Seamlessly fall back to built-in product catalog so user experience is never broken
      let filtered = [...FALLBACK_PRODUCTS];
      if (brand && brand.toLowerCase() !== "all") {
        filtered = filtered.filter((p) => (p.brand || "").toLowerCase() === brand.toLowerCase());
      }
      if (sort === "price_asc") {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sort === "price_desc") {
        filtered.sort((a, b) => b.price - a.price);
      }
      setProducts(filtered);
      setBrands(getFallbackBrandStats(FALLBACK_PRODUCTS));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBrand, selectedSort]);

  useEffect(() => {
    fetchProducts(selectedBrand, selectedSort);
  }, [selectedBrand, selectedSort, fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(selectedBrand, selectedSort);
  };

  const handleBrandSelect = (brandName) => {
    setSelectedBrand(brandName);
  };

  const handleSortSelect = (sortKey) => {
    setSelectedSort(sortKey);
  };

  const handleProductPress = (product) => {
    navigation.navigate("ProductDetail", { item: product });
  };

  const rightHeaderActions = (
    <View style={styles.headerActions}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Search")}
        style={styles.headerIconButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="search-outline" size={22} color={theme.colors.black} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("Wishlist")}
        style={styles.headerIconButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="heart-outline" size={22} color={theme.colors.black} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header showLogo={true} rightAction={rightHeaderActions} />

      {/* Brand Chips Filter & Sort */}
      <BrandFilterBar
        brands={brands}
        selectedBrand={selectedBrand}
        onSelectBrand={handleBrandSelect}
        selectedSort={selectedSort}
        onSelectSort={handleSortSelect}
      />

      {loading && !refreshing ? (
        <Loader message="Loading latest sneakers..." />
      ) : error && products.length === 0 ? (
        <ErrorState
          title="Connection Error"
          message={error}
          onRetry={() => {
            setLoading(true);
            fetchProducts(selectedBrand, selectedSort);
          }}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title={`No ${selectedBrand === "All" ? "" : selectedBrand} Shoes Found`}
          message="Try selecting a different brand or resetting the filter."
          actionLabel="View All Shoes"
          onAction={() => setSelectedBrand("All")}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item._id || item.serpapiId || item.name)}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.black}
            />
          }
          ListHeaderComponent={
            <View style={styles.resultsInfoRow}>
              <Text style={styles.resultsCountText}>
                {selectedBrand === "All" ? "All Footwear" : selectedBrand} ({products.length})
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={handleProductPress} />
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIconButton: {
    padding: 2,
  },
  listContainer: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  resultsInfoRow: {
    paddingBottom: 12,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
