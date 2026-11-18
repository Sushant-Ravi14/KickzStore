import React, { useEffect, useState } from "react";
import { View, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getToken } from "../../utils/auth";
import LoadingView from "../common/LoadingView";

export const CustomerGuard = ({ children, fallbackScreen = "Login" }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const token = await getToken();
      if (!token) {
        if (isMounted) {
          setIsVerifying(false);
          Alert.alert("Authentication Required", "Please log in to continue.");
          navigation.navigate(fallbackScreen);
        }
        return;
      }

      if (isMounted) {
        setIsAuthenticated(true);
        setIsVerifying(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [fallbackScreen, navigation]);

  if (isVerifying) {
    return <LoadingView message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <View style={{ flex: 1 }} />;
  }

  return <>{children}</>;
};

export default CustomerGuard;
