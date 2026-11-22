import React, { useState, useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { API_BASE_URL } from "../../config/api";
import { getToken } from "../../utils/auth";
import Header from "../../components/ui/Header";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";

export default function CardScreen({ navigation }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchCards = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      const res = await fetch(`${API_BASE_URL}/api/cards`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCards(Array.isArray(data) ? data : []);
      }
    } catch (_err) {
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCards();
    }, [])
  );

  const handleDeleteCard = (cardId) => {
    Alert.alert("Remove Card", "Are you sure you want to delete this payment card?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getToken();
            const res = await fetch(`${API_BASE_URL}/api/cards/${cardId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              fetchCards();
            }
          } catch (_e) {}
        },
      },
    ]);
  };

  const rightAction = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate("AddCard")}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="add" size={24} color={theme.colors.black} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Header
        showBack={true}
        navigation={navigation}
        title="Payment Cards"
        rightAction={rightAction}
      />

      {loading ? (
        <Loader message="Loading payment cards..." />
      ) : !isLoggedIn ? (
        <EmptyState
          icon="card-outline"
          title="Sign in for Cards"
          message="Sign in to view and manage your payment methods."
          actionLabel="Sign In"
          onAction={() => navigation.navigate("Login")}
        />
      ) : cards.length === 0 ? (
        <EmptyState
          icon="card-outline"
          title="No Saved Cards"
          message="Save a simulated payment card for 1-click checkout."
          actionLabel="Add Card"
          onAction={() => navigation.navigate("AddCard")}
        />
      ) : (
        <View style={styles.container}>
          <FlatList
            data={cards}
            keyExtractor={(item) => String(item._id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const last4 = item.last4 || (item.cardNumber ? item.cardNumber.slice(-4) : "1234");
              const brand = item.brand || item.cardName || "Visa";

              return (
                <Card style={styles.cardItem}>
                  <View style={styles.cardHeader}>
                    <View style={styles.brandContainer}>
                      <Ionicons name="card" size={20} color={theme.colors.black} />
                      <Text style={styles.brandText}>{brand.toUpperCase()}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteCard(item._id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.cardNumber}>•••• •••• •••• {last4}</Text>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.metaLabel}>CARDHOLDER</Text>
                      <Text style={styles.metaValue}>{item.cardHolderName || "Customer"}</Text>
                    </View>
                    <View>
                      <Text style={styles.metaLabel}>EXPIRES</Text>
                      <Text style={styles.metaValue}>{item.expiryDate || "12/28"}</Text>
                    </View>
                    {item.mockBalance !== undefined && (
                      <View>
                        <Text style={styles.metaLabel}>BALANCE</Text>
                        <Text style={styles.metaValue}>${item.mockBalance}</Text>
                      </View>
                    )}
                  </View>
                </Card>
              );
            }}
          />

          <View style={styles.bottomBar}>
            <Button
              title="Add New Card"
              variant="primary"
              size="lg"
              onPress={() => navigation.navigate("AddCard")}
              icon={<Ionicons name="add" size={20} color={theme.colors.white} />}
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
    padding: theme.spacing.lg,
    paddingBottom: 20,
  },
  cardItem: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    padding: 18,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: 2,
    marginVertical: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
  },
  bottomBar: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
});
