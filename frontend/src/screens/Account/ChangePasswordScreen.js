import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
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

export default function ChangePasswordScreen({ navigation }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!oldPassword) errs.oldPassword = "Old password is required.";
    if (!newPassword) {
      errs.newPassword = "New password is required.";
    } else if (newPassword.length < 6) {
      errs.newPassword = "Password must be at least 6 characters.";
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Auth Error", "Please log in first.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/users/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Your password has been changed successfully.", [
          { text: "Done", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to change password.");
      }
    } catch (_err) {
      Alert.alert("Error", "Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Header showBack={true} navigation={navigation} title="Change Password" />

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
            label="Current Password"
            placeholder="Enter existing password"
            value={oldPassword}
            onChangeText={(text) => {
              setOldPassword(text);
              if (errors.oldPassword) setErrors((e) => ({ ...e, oldPassword: null }));
            }}
            error={errors.oldPassword}
            secureTextEntry
          />

          <Input
            label="New Password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              if (errors.newPassword) setErrors((e) => ({ ...e, newPassword: null }));
            }}
            error={errors.newPassword}
            secureTextEntry
          />

          <Input
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: null }));
            }}
            error={errors.confirmPassword}
            secureTextEntry
          />

          <Button
            title="Update Password"
            loading={loading}
            onPress={handleChangePassword}
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
  submitButton: {
    marginTop: 16,
  },
});
