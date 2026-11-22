import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../theme";
import { API_BASE_URL } from "../../config/api";
import { getToken } from "../../utils/auth";
import Header from "../../components/ui/Header";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function AddCardScreen({ navigation }) {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const rawNumber = cardNumber.replace(/\s+/g, "");
    if (!rawNumber || rawNumber.length < 15) {
      errs.cardNumber = "Enter a valid 16-digit card number.";
    }
    if (!cardHolderName.trim()) {
      errs.cardHolderName = "Cardholder name is required.";
    }
    if (!expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(expiryDate.trim())) {
      errs.expiryDate = "Enter expiry format as MM/YY.";
    }
    if (!cvv || cvv.length < 3) {
      errs.cvv = "Enter 3-digit CVV.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCardNumberChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    setCardNumber(formatted);
    if (errors.cardNumber) setErrors((e) => ({ ...e, cardNumber: null }));
  };

  const handleExpiryChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 4);
    if (cleaned.length >= 3) {
      setExpiryDate(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpiryDate(cleaned);
    }
    if (errors.expiryDate) setErrors((e) => ({ ...e, expiryDate: null }));
  };

  const handleAddCard = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const token = await getToken();
      const rawNumber = cardNumber.replace(/\s+/g, "");

      const res = await fetch(`${API_BASE_URL}/api/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardName: cardName.trim() || "Kickz Card",
          cardNumber: rawNumber,
          cardHolderName: cardHolderName.trim(),
          expiryDate: expiryDate.trim(),
          cvv: cvv.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Card Added", "Payment card saved securely for checkout.", [
          { text: "Done", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to add card.");
      }
    } catch (_err) {
      Alert.alert("Error", "Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Header showBack={true} navigation={navigation} title="Add Payment Card" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Card Label (Optional)"
            placeholder="e.g. My Visa"
            value={cardName}
            onChangeText={setCardName}
          />

          <Input
            label="Card Number"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChangeText={handleCardNumberChange}
            error={errors.cardNumber}
            keyboardType="numeric"
            maxLength={19}
          />

          <Input
            label="Cardholder Name"
            placeholder="John Doe"
            value={cardHolderName}
            onChangeText={(text) => {
              setCardHolderName(text);
              if (errors.cardHolderName) setErrors((e) => ({ ...e, cardHolderName: null }));
            }}
            error={errors.cardHolderName}
            autoCapitalize="words"
          />

          <View style={styles.twoCol}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="Expiry Date"
                placeholder="MM/YY"
                value={expiryDate}
                onChangeText={handleExpiryChange}
                error={errors.expiryDate}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                label="CVV"
                placeholder="123"
                value={cvv}
                onChangeText={(text) => {
                  setCvv(text.replace(/[^0-9]/g, ""));
                  if (errors.cvv) setErrors((e) => ({ ...e, cvv: null }));
                }}
                error={errors.cvv}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <Button
            title="Save Card"
            loading={loading}
            onPress={handleAddCard}
            variant="primary"
            size="lg"
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: 24,
  },
  twoCol: {
    flexDirection: "row",
  },
  submitButton: {
    marginTop: 16,
  },
});
