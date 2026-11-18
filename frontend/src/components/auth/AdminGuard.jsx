import React, { useEffect, useState } from "react";
import { View, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../../api/client";
import { getToken } from "../../utils/auth";
import LoadingView from "../common/LoadingView";

export const AdminGuard = ({ children }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    let isMounted = true;

    const verifyRole = async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (isMounted) {
            setIsVerifying(false);
            Alert.alert("Authentication Required", "Please sign in to access the Admin Panel.");
            navigation.navigate("Login");
          }
          return;
        }

        // Strictly verify role from the server database, NEVER trust client storage
        const response = await api.get("/api/users/profile");
        const serverRole = response?.user?.role;

        if (serverRole === "admin") {
          if (isMounted) {
            setIsAdmin(true);
            setIsVerifying(false);
          }
        } else {
          if (isMounted) {
            setIsVerifying(false);
            Alert.alert("Access Denied", "You do not have administrative privileges.");
            navigation.navigate("MainMenu", { screen: "Home" });
          }
        }
      } catch (_err) {
        if (isMounted) {
          setIsVerifying(false);
          Alert.alert("Authorization Failed", "Could not verify admin credentials.");
          navigation.navigate("MainMenu", { screen: "Home" });
        }
      }
    };

    verifyRole();

    return () => {
      isMounted = false;
    };
  }, [navigation]);

  if (isVerifying) {
    return <LoadingView message="Verifying administrative credentials..." />;
  }

  if (!isAdmin) {
    return <View style={{ flex: 1 }} />;
  }

  return <>{children}</>;
};

export default AdminGuard;
