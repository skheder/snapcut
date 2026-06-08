import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { C } from "../lib/theme";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name:"", email:"", password:"", phone:"", role:"customer", specialty:"" });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handle() {
    if (!form.name || !form.email || !form.password)
      return Alert.alert("Please fill in all required fields");
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim().toLowerCase() });
    } catch (e) {
      Alert.alert("Sign up failed", e.response?.data?.error || "Please try again");
    } finally { setLoading(false); }
  }

  return (
    <ScrollView style={s.wrap} contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
      <Text style={s.logo}>SnapCut</Text>
      <Text style={s.sub}>Create your account</Text>

      {/* Role picker */}
      <View style={s.roleRow}>
        {["customer","barber"].map(r => (
          <TouchableOpacity key={r} style={[s.roleBtn, form.role === r && s.roleBtnActive]}
            onPress={() => set("role", r)}>
            <Text style={[s.roleTxt, form.role === r && s.roleTxtActive]}>
              {r === "customer" ? "👤 Customer" : "✂️ Barber"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={s.input} placeholder="Full name *" placeholderTextColor={C.muted}
        value={form.name} onChangeText={v => set("name", v)} />
      <TextInput style={s.input} placeholder="Email *" placeholderTextColor={C.muted}
        value={form.email} onChangeText={v => set("email", v)}
        autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={s.input} placeholder="Password (min 8 chars) *" placeholderTextColor={C.muted}
        value={form.password} onChangeText={v => set("password", v)} secureTextEntry />
      <TextInput style={s.input} placeholder="Phone number" placeholderTextColor={C.muted}
        value={form.phone} onChangeText={v => set("phone", v)} keyboardType="phone-pad" />

      {form.role === "barber" && (
        <TextInput style={s.input} placeholder="Specialty (e.g. Fades & Tapers)"
          placeholderTextColor={C.muted} value={form.specialty}
          onChangeText={v => set("specialty", v)} />
      )}

      <TouchableOpacity style={s.btn} onPress={handle} disabled={loading}>
        {loading ? <ActivityIndicator color={C.dark} />
          : <Text style={s.btnTxt}>Create Account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={s.link}>Already have an account? <Text style={{ color: C.yellow }}>Log in</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:          { flex: 1, backgroundColor: C.dark },
  inner:         { padding: 28, paddingTop: 60 },
  logo:          { fontSize: 36, fontWeight: "900", color: C.yellow, letterSpacing: -1, marginBottom: 4 },
  sub:           { fontSize: 15, color: C.muted, marginBottom: 28 },
  roleRow:       { flexDirection: "row", gap: 10, marginBottom: 20 },
  roleBtn:       { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1,
                   borderColor: C.border, alignItems: "center" },
  roleBtnActive: { backgroundColor: "rgba(232,255,71,0.1)", borderColor: C.yellow },
  roleTxt:       { color: C.muted, fontWeight: "600", fontSize: 14 },
  roleTxtActive: { color: C.yellow },
  input:         { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14,
                   padding: 16, color: C.text, fontSize: 15, marginBottom: 12 },
  btn:           { backgroundColor: C.yellow, borderRadius: 14, padding: 18,
                   alignItems: "center", marginTop: 6, marginBottom: 20 },
  btnTxt:        { color: C.dark, fontWeight: "800", fontSize: 15 },
  link:          { color: C.muted, textAlign: "center", fontSize: 14 },
});
