import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { API_BASE_URL } from "../../config/api";
import { FALLBACK_PRODUCTS, getFallbackBrandStats } from "../../data/fallbackProducts";
import Header from "../../components/ui/Header";
import Input from "../../components/ui/Input";
import BrandFilterBar from "../../components/ui/BrandFilterBar";
import ProductCard from "../../components/ui/ProductCard";
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [brands, setBrands] = useState(getFallbackBrandStats(FALLBACK_PRODUCTS));
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedSort, setSelectedSort] = useState("featured");
  const [recentSearches, setRecentSearches] = useState(["Nike", "Jordan", "Running", "Sneakers"]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const debounceTimerRef = useRef(null);

  const fetchSearchResults = useCallback(
    async (searchTerm = "", brand = selectedBrand, sort = selectedSort) => {
      setLoading(true);
      try {
        let url = `${API_BASE_URL}/api/products?format=full`;
        if (searchTerm.trim()) {
          url += `&q=${encodeURIComponent(searchTerm.trim())}`;
        }
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
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.products || [];
          setProducts(list);
          if (data.brands && data.brands.length > 0) {
            setBrands(data.brands);
          }
        }
      } catch (err) {
        console.warn("Search fetch notice:", err.message);
        // Fallback search over built-in catalog so search is always functional
        let filtered = [...FALLBACK_PRODUCTS];
        if (searchTerm.trim()) {
          const qLower = searchTerm.trim().toLowerCase();
          filtered = filtered.filter(
            (p) =>
              (p.name || "").toLowerCase().includes(qLower) ||
              (p.brand || "").toLowerCase().includes(qLower) ||
              (p.category || "").toLowerCase().includes(qLower)
          );
        }
        if (brand && brand.toLowerCase() !== "all") {
          filtered = filtered.filter(
            (p) => (p.brand || "").toLowerCase() === brand.toLowerCase()
          );
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
    },
    [selectedBrand, selectedSort]
  );

  useEffect(() => {
    fetchSearchResults(query, selectedBrand, selectedSort);
  }, [selectedBrand, selectedSort, fetchSearchResults, query]);

  const handleQueryChange = (text) => {
    setQuery(text);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchSearchResults(text, selectedBrand, selectedSort);
      if (text.trim() && !recentSearches.includes(text.trim())) {
        setRecentSearches((prev) => [text.trim(), ...prev.slice(0, 4)]);
      }
    }, 350);
  };

  const handleRecentPress = (term) => {
    setQuery(term);
    fetchSearchResults(term, selectedBrand, selectedSort);
  };

  const handleProductPress = (product) => {
    navigation.navigate("ProductDetail", { item: product });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="Search" />

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Input
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search by model, brand, or style..."
          leftIcon={<Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />}
          rightIcon={
            query.length > 0 ? (
              <TouchableOpacity onPress={() => handleQueryChange("")}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ) : null
          }
          style={styles.searchInput}
        />
      </View>

      {/* Brand Chips and Sort Bar */}
      <BrandFilterBar
        brands={brands}
        selectedBrand={selectedBrand}
        onSelectBrand={(b) => setSelectedBrand(b)}
        selectedSort={selectedSort}
        onSelectSort={(s) => setSelectedSort(s)}
      />

      {/* Recent Searches Pills */}
      {!query.trim() && recentSearches.length > 0 && (
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Popular Searches:</Text>
          <View style={styles.recentTagsRow}>
            {recentSearches.map((term, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => handleRecentPress(term)}
                style={styles.recentTag}
              >
                <Text style={styles.recentTagText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {loading && !refreshing ? (
        <Loader message="Searching shoes..." />
      ) : products.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No Results Found"
          message={`No shoes found matching "${query}". Try checking your spelling or adjusting filters.`}
          actionLabel="Clear Search"
          onAction={() => {
            setQuery("");
            setSelectedBrand("All");
          }}
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
              onRefresh={() => {
                setRefreshing(true);
                fetchSearchResults(query, selectedBrand, selectedSort);
              }}
              tintColor={theme.colors.black}
            />
          }
          ListHeaderComponent={
            <View style={styles.countRow}>
              <Text style={styles.countText}>{products.length} Products Found</Text>
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
  searchBarContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  searchInput: {
    marginBottom: theme.spacing.xs,
  },
  recentContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    backgroundColor: theme.colors.surfaceSubtle,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  recentTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  recentTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  recentTag: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  recentTagText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: "500",
  },
  listContainer: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  countRow: {
    paddingBottom: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
  },
});
