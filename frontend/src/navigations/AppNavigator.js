import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { theme } from "../theme";

import SplashScreen from "../screens/Splash/SplashScreen";
import MenuNavigator from "./MenuNavigator";
import ProductDetailScreen from "../screens/ProductDetail/ProductDetailScreen";
import WishlistScreen from "../screens/Wishlist/WishlistScreen";
import CheckoutScreen from "../screens/Order/CheckoutScreen";
import OrderDetailScreen from "../screens/Order/OrderDetailScreen";
import LoginScreen from "../screens/Account/LoginScreen";
import RegisterScreen from "../screens/Account/RegisterScreen";
import UpdateProfileScreen from "../screens/Account/UpdateProfileScreen";
import ChangePasswordScreen from "../screens/Account/ChangePasswordScreen";
import CardScreen from "../screens/Card/CardScreen";
import AddCardScreen from "../screens/Card/AddCardScreen";
import AdminNavigator from "../screens/Admin/AdminNavigator";

// Admin detail sub-screens
import CreateUserScreen from "../screens/Admin/User/CreateUserScreen";
import UserDetailScreen from "../screens/Admin/User/UserDetailScreen";
import AdminOrderDetailScreen from "../screens/Admin/Order/AdminOrderDetailScreen";
import VoucherDetailScreen from "../screens/Admin/Voucher/VoucherDetailScreen";
import AdminProductDetailScreen from "../screens/Admin/Product/AdminProductDetailScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="MainMenu" component={MenuNavigator} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Card" component={CardScreen} />
      <Stack.Screen name="AddCard" component={AddCardScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminNavigator} />
      <Stack.Screen name="Admin" component={AdminNavigator} />

      {/* Admin Sub Screens */}
      <Stack.Screen name="CreateUser" component={CreateUserScreen} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
      <Stack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
      <Stack.Screen name="VoucherDetail" component={VoucherDetailScreen} />
      <Stack.Screen name="AdminProductDetail" component={AdminProductDetailScreen} />
    </Stack.Navigator>
  );
}
