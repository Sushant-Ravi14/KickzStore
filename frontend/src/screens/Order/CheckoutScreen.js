import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { API_BASE_URL } from "../../config/api";
import { getToken } from "../../utils/auth";
import Header from "../../components/ui/Header";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

export default function CheckoutScreen({ route, navigation }) {
  const { selectedItems = [] } = route.params || {};
  const [address, setAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [voucherCode, setVoucherCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [myCards, setMyCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [cvv, setCvv] = useState("");
  const [isCvvModalVisible, setIsCvvModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserAddress = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok && data.user && data.user.address) {
          const addr = data.user.address;
          const addressString = [addr.street, addr.district, addr.city, addr.country]
            .filter(Boolean)
            .join(", ");
          setAddress(addressString);
        }
      } catch (_e) {}
    };

    fetchUserAddress();
  }, []);

  useEffect(() => {
    const fetchCards = async () => {
      if (paymentMethod !== "credit_card") {
        setMyCards([]);
        return;
      }
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/cards`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setMyCards(data);
          if (data.length > 0) {
            setSelectedCardId(data[0]._id);
          }
        }
      } catch (_e) {}
    };

    fetchCards();
  }, [paymentMethod]);

  const subtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const price = item.productId?.extracted_price || item.productId?.price || 99;
      return sum + Number(price) * Number(item.quantity || 1);
    }, 0);
  }, [selectedItems]);

  const shippingFee = shippingMethod === "express" ? 15 : 0;
  const total = subtotal + shippingFee;

  const submitOrder = async () => {
    if (paymentMethod === "credit_card" && !cvv) {
      Alert.alert("CVV Required", "Please enter the 3-digit CVV to confirm card transaction.");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Authentication", "Please sign in to place order.");
        navigation.navigate("Login");
        return;
      }

      const itemsToOrder = selectedItems.map((item) => ({
        productId: item.productId._id,
        size: item.size,
        color: item.color,
      }));

      const orderPayload = {
        selectedItems: itemsToOrder,
        shippingMethod,
        address: address.trim(),
        paymentMethod,
        voucherCode: voucherCode.trim() || undefined,
        cardId: paymentMethod === "credit_card" ? selectedCardId : undefined,
        cvv: paymentMethod === "credit_card" ? cvv.trim() : undefined,
      };

      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Order Placed", data.message || "Your order has been confirmed!", [
          {
            text: "View Order",
            onPress: () => {
              navigation.reset({
                index: 1,
                routes: [
                  { name: "MainMenu" },
                  { name: "OrderDetail", params: { orderId: data.order?._id || data.order?.id } },
                ],
              });
            },
          },
        ]);
      } else {
        Alert.alert("Order Incomplete", data.message || "Could not complete order.");
      }
    } catch (_err) {
      Alert.alert("Connection Error", "Cannot reach the store server.");
    } finally {
      setLoading(false);
      setIsCvvModalVisible(false);
      setCvv("");
    }
  };

  const handlePlaceOrder = () => {
    if (!address.trim()) {
      Alert.alert("Delivery Address", "Please provide a shipping delivery address.");
      return;
    }

    if (paymentMethod === "cod") {
      submitOrder();
    } else if (paymentMethod === "credit_card") {
      if (!selectedCardId) {
        Alert.alert("Card Required", "Please select a payment card or add a new one.");
        return;
      }
      setIsCvvModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Header showBack={true} navigation={navigation} title="Checkout" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DELIVERY ADDRESS</Text>
          <Input
            placeholder="Street address, city, state, postal code"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Order Items Review */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ORDER ITEMS ({selectedItems.length})</Text>
          {selectedItems.map((item, idx) => {
            const p = item.productId || {};
            const title = p.title || p.name || "Sneaker Shoe";
            const price = p.extracted_price || p.price || 99;
            const imageUrl =
              p.thumbnail ||
              p.img ||
              (Array.isArray(p.img) ? p.img[0] : null) ||
              "https://images.unsplash.com/photo-1542291026-7eec264c27ff";

            return (
              <Card key={idx} style={styles.itemCard}>
                <Image source={{ uri: imageUrl }} style={styles.itemImage} contentFit="contain" />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.itemMeta}>
                    Size: {item.size || "42"}  •  Color: {item.color || "Black"}  •  Qty: {item.quantity}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ${(Number(price) * Number(item.quantity)).toFixed(2).replace(/\.00$/, "")}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>

        {/* Shipping Method */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SHIPPING METHOD</Text>
          <View style={styles.optionsCol}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShippingMethod("standard")}
              style={[
                styles.optionRow,
                shippingMethod === "standard" && styles.optionRowActive,
              ]}
            >
              <View style={styles.radio}>
                {shippingMethod === "standard" && <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Standard Delivery</Text>
                <Text style={styles.optionDesc}>3-5 Business Days</Text>
              </View>
              <Text style={styles.optionPrice}>FREE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShippingMethod("express")}
              style={[
                styles.optionRow,
                shippingMethod === "express" && styles.optionRowActive,
              ]}
            >
              <View style={styles.radio}>
                {shippingMethod === "express" && <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Express Priority</Text>
                <Text style={styles.optionDesc}>1-2 Business Days</Text>
              </View>
              <Text style={styles.optionPrice}>$15.00</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PAYMENT METHOD</Text>
          <View style={styles.optionsCol}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPaymentMethod("cod")}
              style={[
                styles.optionRow,
                paymentMethod === "cod" && styles.optionRowActive,
              ]}
            >
              <View style={styles.radio}>
                {paymentMethod === "cod" && <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Cash on Delivery</Text>
                <Text style={styles.optionDesc}>Pay when package arrives at your door</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPaymentMethod("credit_card")}
              style={[
                styles.optionRow,
                paymentMethod === "credit_card" && styles.optionRowActive,
              ]}
            >
              <View style={styles.radio}>
                {paymentMethod === "credit_card" && <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Saved Payment Card</Text>
                <Text style={styles.optionDesc}>Encrypted instant checkout</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Cards List if Credit Card selected */}
          {paymentMethod === "credit_card" && (
            <View style={styles.cardsContainer}>
              {myCards.length > 0 ? (
                myCards.map((card) => {
                  const isSelected = selectedCardId === card._id;
                  const last4 = card.last4 || (card.cardNumber ? card.cardNumber.slice(-4) : "1234");
                  const brand = card.brand || card.cardName || "Card";

                  return (
                    <TouchableOpacity
                      key={card._id}
                      activeOpacity={0.7}
                      onPress={() => setSelectedCardId(card._id)}
                      style={[
                        styles.cardSelectRow,
                        isSelected && styles.cardSelectRowActive,
                      ]}
                    >
                      <Ionicons name="card" size={20} color={theme.colors.black} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.cardSelectTitle}>
                          {brand} •••• {last4}
                        </Text>
                        <Text style={styles.cardSelectSubtitle}>
                          Exp: {card.expiryDate || "12/28"}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.black} />
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.noCardRow}>
                  <Text style={styles.noCardText}>No saved cards found.</Text>
                  <Button
                    title="Add Card"
                    size="sm"
                    variant="outline"
                    onPress={() => navigation.navigate("AddCard")}
                    fullWidth={false}
                  />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Voucher Code */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PROMO / VOUCHER CODE</Text>
          <Input
            placeholder="e.g. KICKZ10, SAVE20, WELCOME"
            value={voucherCode}
            onChangeText={setVoucherCode}
            autoCapitalize="characters"
          />
        </View>

        {/* Pricing Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Items Subtotal</Text>
            <Text style={styles.priceVal}>${subtotal.toFixed(2).replace(/\.00$/, "")}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping</Text>
            <Text style={styles.priceVal}>
              {shippingFee === 0 ? "FREE" : `$${shippingFee.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>${total.toFixed(2).replace(/\.00$/, "")}</Text>
          </View>
        </Card>

        {/* Place Order Button */}
        <Button
          title={loading ? "Confirming Order..." : `Place Order • $${total.toFixed(2).replace(/\.00$/, "")}`}
          loading={loading}
          onPress={handlePlaceOrder}
          variant="primary"
          size="lg"
          style={styles.orderButton}
        />
      </ScrollView>

      {/* CVV Verification Modal */}
      <Modal
        visible={isCvvModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCvvModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>Security Verification</Text>
            <Text style={styles.modalSubtitle}>
              Please enter the 3-digit CVV code on the back of your card to authorize payment.
            </Text>

            <Input
              placeholder="123"
              value={cvv}
              onChangeText={setCvv}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              style={{ marginVertical: 14 }}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setIsCvvModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
                fullWidth={false}
              />
              <Button
                title="Authorize & Pay"
                variant="primary"
                loading={loading}
                onPress={submitOrder}
                style={{ flex: 1.5, marginLeft: 8 }}
                fullWidth={false}
              />
            </View>
          </Card>
        </KeyboardAvoidingView>
      </Modal>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
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
    padding: 10,
  },
  itemImage: {
    width: 50,
    height: 50,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.sm,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
  },
  itemMeta: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: 2,
  },
  optionsCol: {
    gap: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background,
  },
  optionRowActive: {
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.black,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  optionDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  optionPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text,
  },
  cardsContainer: {
    marginTop: 10,
    gap: 8,
  },
  cardSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
  },
  cardSelectRowActive: {
    borderColor: theme.colors.black,
  },
  cardSelectTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
  },
  cardSelectSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  noCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.sm,
  },
  noCardText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 24,
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
  orderButton: {
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
  },
});
