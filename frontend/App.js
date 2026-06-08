import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StripeProvider } from "@stripe/stripe-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "./src/hooks/useAuth";
import { STRIPE_PUBLISHABLE_KEY } from "./src/lib/config";

import LoginScreen      from "./src/screens/LoginScreen";
import RegisterScreen   from "./src/screens/RegisterScreen";
import HomeScreen       from "./src/screens/HomeScreen";
import BrowseScreen     from "./src/screens/BrowseScreen";
import BarberScreen     from "./src/screens/BarberScreen";
import CheckoutScreen   from "./src/screens/CheckoutScreen";
import TrackingScreen   from "./src/screens/TrackingScreen";
import MembershipScreen from "./src/screens/MembershipScreen";
import BarberDashScreen from "./src/screens/BarberDashScreen";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login"    component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user.role === "barber" ? (
        <Stack.Screen name="BarberDash" component={BarberDashScreen} />
      ) : (
        <>
          <Stack.Screen name="Home"       component={HomeScreen} />
          <Stack.Screen name="Browse"     component={BrowseScreen} />
          <Stack.Screen name="Barber"     component={BarberScreen} />
          <Stack.Screen name="Checkout"   component={CheckoutScreen} />
          <Stack.Screen name="Tracking"   component={TrackingScreen} />
          <Stack.Screen name="Membership" component={MembershipScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
