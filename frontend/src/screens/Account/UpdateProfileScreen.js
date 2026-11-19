import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../theme";
import { API_BASE_URL } from "../../config/api";
import { getToken } from "../../utils/auth";
import Header from "../../components/ui/Header";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function UpdateProfileScreen({ route, navigation }) {
  const { user = {} } = route.params || {};
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [street, setStreet] = useState(user.address?.street || "");
  const [city, setCity] = useState(user.address?.city || "");
  const [country, setCountry] = useState(user.address?.country || "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Validation", "First and last name are required.");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Auth Error", "Please log in first.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          address: {
            street: street.trim(),
            city: city.trim(),
            country: country.trim(),
          },
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Profile Updated", "Your changes have been saved.", [
          { text: "Done", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to update profile.");
      }
    } catch (_err) {
      Alert.alert("Error", "Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Header showBack={true} navigation={navigation} title="Update Profile" />

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
          <View style={styles.nameRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last"
              />
            </View>
          </View>

          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 555-0100"
            keyboardType="phone-pad"
          />

          <Input
            label="Street Address"
            value={street}
            onChangeText={setStreet}
            placeholder="123 Sneaker Way"
          />

          <View style={styles.nameRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="City"
                value={city}
                onChangeText={setCity}
                placeholder="City"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                label="Country"
                value={country}
                onChangeText={setCountry}
                placeholder="Country"
              />
            </View>
          </View>

          <Button
            title="Save Changes"
            loading={loading}
            onPress={handleUpdate}
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
  nameRow: {
    flexDirection: "row",
  },
  submitButton: {
    marginTop: 16,
  },
});
