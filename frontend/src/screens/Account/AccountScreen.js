import React, { useState, useCallback } from "react";
import {
  ScrollView,
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
import { getToken, clearAuth } from "../../utils/auth";
import Header from "../../components/ui/Header";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import Logo from "../../components/ui/Logo";

export default function AccountScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (_err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await clearAuth();
          setUser(null);
          navigation.navigate("Home");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="My Account" />
        <Loader message="Loading profile..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="My Account" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {user ? (
          <>
            {/* User Profile Card */}
            <Card style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user.firstName ? user.firstName[0].toUpperCase() : "K"}
                  {user.lastName ? user.lastName[0].toUpperCase() : "S"}
                </Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
                {user.role === "admin" && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>ADMINISTRATOR</Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Account Navigation Menu Items */}
            <View style={styles.menuGroup}>
              <Text style={styles.menuGroupTitle}>SHOPPING & PREFERENCES</Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("Wishlist")}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="heart-outline" size={20} color={theme.colors.black} />
                  <Text style={styles.menuItemLabel}>Wishlist</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("Orders")}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="receipt-outline" size={20} color={theme.colors.black} />
                  <Text style={styles.menuItemLabel}>My Orders</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("Card")}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="card-outline" size={20} color={theme.colors.black} />
                  <Text style={styles.menuItemLabel}>Payment Cards</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuGroup}>
              <Text style={styles.menuGroupTitle}>ACCOUNT SETTINGS</Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("UpdateProfile", { user })}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="person-outline" size={20} color={theme.colors.black} />
                  <Text style={styles.menuItemLabel}>Update Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("ChangePassword")}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.colors.black} />
                  <Text style={styles.menuItemLabel}>Change Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              {user.role === "admin" && (
                <TouchableOpacity
                  style={[styles.menuItem, styles.adminMenuItem]}
                  onPress={() => navigation.navigate("Admin")}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="shield-outline" size={20} color={theme.colors.black} />
                    <Text style={[styles.menuItemLabel, { fontWeight: "700" }]}>
                      Admin Dashboard
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.black} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.logoutContainer}>
              <Button
                title="Sign Out"
                variant="outline"
                onPress={handleLogout}
                icon={<Ionicons name="log-out-outline" size={18} color={theme.colors.black} />}
              />
            </View>
          </>
        ) : (
          <View style={styles.unauthContainer}>
            <View style={styles.unauthHeader}>
              <Logo size="lg" />
              <Text style={styles.unauthTitle}>Join KickzStore</Text>
              <Text style={styles.unauthSubtitle}>
                Sign in to manage your orders, save sneakers to your wishlist, and check out faster.
              </Text>
            </View>

            <View style={styles.authButtonsCol}>
              <Button
                title="Sign In"
                variant="primary"
                size="lg"
                onPress={() => navigation.navigate("Login")}
                style={{ marginBottom: 12 }}
              />

              <Button
                title="Create Account"
                variant="secondary"
                size="lg"
                onPress={() => navigation.navigate("Register")}
              />
            </View>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.black,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.white,
    letterSpacing: 1,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
  },
  profileEmail: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  adminBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.black,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  menuGroup: {
    marginBottom: 24,
  },
  menuGroupTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    marginBottom: 8,
  },
  adminMenuItem: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.borderStrong,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  logoutContainer: {
    marginTop: 12,
  },
  unauthContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  unauthHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  unauthTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    marginTop: 16,
    letterSpacing: -0.4,
  },
  unauthSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 280,
  },
  authButtonsCol: {
    width: "100%",
  },
});
