import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { C } from "../lib/theme";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handle() {
    if (!email || !password) return Alert.alert("Please fill in all fields");
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e) {
      Alert.alert("Login failed", e.response?.data?.error || "Check your details");
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={s.wrap} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.inner}>
        <Text style={s.logo}>SnapCut</Text>
        <Text style={s.sub}>Your barber, on demand.</Text>

        <TextInput style={s.input} placeholder="Email" placeholderTextColor={C.muted}
          value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor={C.muted}
          value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={s.btn} onPress={handle} disabled={loading}>
          {loading ? <ActivityIndicator color={C.dark} />
            : <Text style={s.btnTxt}>Log In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={s.link}>No account? <Text style={{ color: C.yellow }}>Sign up free</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap:   { flex: 1, backgroundColor: C.dark },
  inner:  { flex: 1, justifyContent: "center", padding: 28 },
  logo:   { fontSize: 42, fontWeight: "900", color: C.yellow, letterSpacing: -1, marginBottom: 6 },
  sub:    { fontSize: 15, color: C.muted, marginBottom: 40 },
  input:  { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14,
            padding: 16, color: C.text, fontSize: 15, marginBottom: 14 },
  btn:    { backgroundColor: C.yellow, borderRadius: 14, padding: 18,
            alignItems: "center", marginTop: 4, marginBottom: 20 },
  btnTxt: { color: C.dark, fontWeight: "800", fontSize: 15 },
  link:   { color: C.muted, textAlign: "center", fontSize: 14 },
});
