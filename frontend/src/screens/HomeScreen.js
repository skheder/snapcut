import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import * as Location from "expo-location";
import { useAuth } from "../hooks/useAuth";
import { getBarbers, getMySubscription } from "../lib/api";
import { C } from "../lib/theme";

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [barberCount, setBarberCount] = useState(0);
  const [plan, setPlan]               = useState("basic");
  const [referralCopied, setReferralCopied] = useState(false);
  const surgeActive = plan === "basic";

  useEffect(() => {
    (async () => {
      // Load subscription
      try { const { data } = await getMySubscription(); setPlan(data.plan || "basic"); } catch (e) { console.log("BARBER ERROR:", e.message); try { const { data } = await getBarbers(); console.log("FALLBACK BARBERS:", JSON.stringify(data)); setBarberCount(data.filter(b => b.status === "available").length); } catch (e2) { console.log("FALLBACK ERROR:", e2.message); } }

      // Load nearby barbers
      try {
        const { status } = await Location.requestForegroundPermissionsAsync(); console.log("LOCATION STATUS:", status);
        let lat, lng;
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }).catch(() => null); if (!loc) throw new Error("no loc");
          lat = loc.coords.latitude; lng = loc.coords.longitude;
        }
        const { data } = await getBarbers(lat, lng);
        console.log("BARBERS:", JSON.stringify(data)); setBarberCount(data.filter(b => b.status === "available").length);
      } catch (e) { console.log("BARBER ERROR:", e.message); try { const { data } = await getBarbers(); console.log("FALLBACK BARBERS:", JSON.stringify(data)); setBarberCount(data.filter(b => b.status === "available").length); } catch (e2) { console.log("FALLBACK ERROR:", e2.message); } }
    })();
  }, []);

  function copyReferral() {
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
    // In production: Clipboard.setStringAsync("SNAP-" + user.id.slice(0,4).toUpperCase())
  }

  return (
    <ScrollView style={s.wrap} contentContainerStyle={s.inner}>
      {/* Nav */}
      <View style={s.nav}>
        <Text style={s.logo}>SnapCut</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={s.pill} onPress={() => navigation.navigate("Membership")}>
            <Text style={s.pillTxt}>{plan === "basic" ? "⚡ Go Pro" : plan === "pro" ? "⚡ Pro" : "👑 VIP"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.pill, { backgroundColor: "rgba(255,255,255,0.06)" }]} onPress={logout}>
            <Text style={[s.pillTxt, { color: C.muted }]}>Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero */}
      <Text style={s.h1}>Your next cut,{"\n"}<Text style={{ color: C.yellow }}>now.</Text></Text>
      <Text style={s.sub}>Book a barber in minutes. They come to you.</Text>

      {/* Surge banner */}
      {surgeActive && (
        <TouchableOpacity style={s.surgeBanner} onPress={() => navigation.navigate("Membership")}>
          <Text style={s.surgeTitle}>⚡ Surge pricing active · 1.4×</Text>
          <Text style={s.surgeSub}>High demand · Tap to remove with Pro →</Text>
        </TouchableOpacity>
      )}

      {/* Map placeholder — replace with MapView in production */}
      <View style={s.mapBox}>
        <Text style={s.mapEmoji}>🗺</Text>
        <Text style={s.mapLabel}>{barberCount} barbers nearby</Text>
      </View>

      <TouchableOpacity style={s.cta} onPress={() => navigation.navigate("Browse")}>
        <Text style={s.ctaTxt}>Find a Barber →</Text>
      </TouchableOpacity>

      {/* Stats */}
      <View style={s.statsRow}>
        {[[`${barberCount}`,"Online Now"],["8 min","Avg ETA"],["4.9★","Avg Rating"]].map(([n,l]) => (
          <View key={l} style={s.stat}>
            <Text style={s.statN}>{n}</Text>
            <Text style={s.statL}>{l}</Text>
          </View>
        ))}
      </View>

      {/* Referral */}
      <TouchableOpacity style={s.referral} onPress={copyReferral}>
        <Text style={s.refTitle}>🎁 Refer a friend, earn $10</Text>
        <Text style={s.refSub}>They get $5 off. You get $10 credit.</Text>
        <View style={s.refCode}>
          <Text style={s.refCodeTxt}>{referralCopied ? "✓ Copied!" : "Tap to copy your code"}</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:        { flex: 1, backgroundColor: C.dark },
  inner:       { padding: 24, paddingTop: 56 },
  nav:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  logo:        { fontSize: 22, fontWeight: "900", color: C.text, letterSpacing: -0.5 },
  pill:        { backgroundColor: "rgba(232,255,71,0.1)", borderWidth: 1, borderColor: "rgba(232,255,71,0.3)",
                 paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillTxt:     { color: C.yellow, fontSize: 12, fontWeight: "700" },
  h1:          { fontSize: 38, fontWeight: "900", color: C.text, letterSpacing: -1, lineHeight: 44, marginBottom: 8 },
  sub:         { fontSize: 15, color: C.muted, marginBottom: 20 },
  surgeBanner: { backgroundColor: "rgba(255,107,53,0.1)", borderWidth: 1, borderColor: "rgba(255,107,53,0.3)",
                 borderRadius: 14, padding: 14, marginBottom: 18 },
  surgeTitle:  { color: C.orange, fontWeight: "700", fontSize: 13, marginBottom: 3 },
  surgeSub:    { color: C.muted, fontSize: 12 },
  mapBox:      { height: 160, backgroundColor: C.card, borderRadius: 20, borderWidth: 1,
                 borderColor: C.border, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  mapEmoji:    { fontSize: 40, marginBottom: 8 },
  mapLabel:    { color: C.yellow, fontWeight: "700", fontSize: 13, letterSpacing: 1 },
  cta:         { backgroundColor: C.yellow, borderRadius: 14, padding: 18,
                 alignItems: "center", marginBottom: 16 },
  ctaTxt:      { color: C.dark, fontWeight: "800", fontSize: 15 },
  statsRow:    { flexDirection: "row", gap: 10, marginBottom: 20 },
  stat:        { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14,
                 borderWidth: 1, borderColor: C.border },
  statN:       { fontSize: 20, fontWeight: "800", color: C.text, marginBottom: 2 },
  statL:       { fontSize: 10, color: C.muted, letterSpacing: 0.5 },
  referral:    { backgroundColor: "rgba(107,53,255,0.08)", borderWidth: 1,
                 borderColor: "rgba(107,53,255,0.25)", borderRadius: 18, padding: 18, marginBottom: 40 },
  refTitle:    { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 4 },
  refSub:      { fontSize: 12, color: C.muted, marginBottom: 12 },
  refCode:     { backgroundColor: "rgba(107,53,255,0.15)", borderRadius: 10, padding: 10 },
  refCodeTxt:  { color: "#9A5CFF", fontWeight: "700", fontSize: 13, textAlign: "center" },
});
