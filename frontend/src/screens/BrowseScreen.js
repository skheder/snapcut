import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from "react-native";
import * as Location from "expo-location";
import { getBarbers, getMySubscription } from "../lib/api";
import { C } from "../lib/theme";

const SURGE = 1.4;

export default function BrowseScreen({ navigation }) {
  const [barbers,      setBarbers]      = useState([]);
  const [filter,       setFilter]       = useState("all");
  const [womensOnly,   setWomensOnly]   = useState(false);
  const [femaleOnly,   setFemaleOnly]   = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [plan,         setPlan]         = useState("basic");

  const surgeActive = plan === "basic";

  useEffect(() => {
    (async () => {
      try { const { data } = await getMySubscription(); setPlan(data.plan || "basic"); } catch {}
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        let lat, lng;
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }).catch(() => null); if (!loc) throw new Error("no loc");
          lat = loc.coords.latitude; lng = loc.coords.longitude;
        }
        const { data } = await getBarbers(lat, lng);
        setBarbers(data);
      } catch (e) {
        try { const { data } = await getBarbers(); setBarbers(data); } catch { Alert.alert("Could not load barbers", "Check your connection"); }
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = barbers
    .filter(b => filter === "all" || b.status === filter)
    .filter(b => !womensOnly || b.accepts_women)
    .filter(b => !femaleOnly || b.is_female);

  function renderBarber({ item: b }) {
    const displayPrice = surgeActive ? (b.base_price * SURGE).toFixed(0) : b.base_price;
    const dist = b.distance_km != null ? `${b.distance_km.toFixed(1)} km` : "–";
    return (
      <TouchableOpacity style={[s.card, b.is_featured && s.featuredCard]}
        onPress={() => navigation.navigate("Barber", { barber: b })}>
        <View style={{ flexDirection:"row", gap:6 }}>
          {b.is_featured && <Text style={s.featuredBadge}>⭐ FEATURED</Text>}
          {b.accepts_women && <Text style={s.womensBadge}>♀ WOMEN'S</Text>}
          {b.is_female && <Text style={s.femaleBadge}>👩 FEMALE</Text>}
        </View>
        <View style={[s.row, { marginTop: (b.is_featured || b.accepts_women) ? 8 : 0 }]}>
          <View style={[s.avatar, { backgroundColor: avatarColor(b.id) }]}>
            <Text style={s.avatarTxt}>{(b.users?.name || "?").slice(0,2).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.row}>
              <Text style={s.name}>{b.users?.name}</Text>
              <View style={[s.dot, { backgroundColor: b.status === "available" ? C.green : C.orange }]} />
            </View>
            <Text style={s.spec}>{b.specialty}</Text>
            <Text style={s.rating}>★ {Number(b.rating).toFixed(1)}  ·  {b.review_count} reviews</Text>
          </View>
        </View>
        <View style={s.chips}>
          {[["ETA", (b.eta_minutes || 10)+" min", true],
            ["Price","$"+displayPrice+(surgeActive?" ⚡":""), false],
            ["Away", dist, false]].map(([l,v,acc]) => (
            <View key={l} style={[s.chip, acc && s.chipAccent]}>
              <Text style={s.chipL}>{l}</Text>
              <Text style={[s.chipV, acc && { color: C.yellow }]}>{v}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.wrap}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Choose Barber</Text>
        <View style={s.onlinePill}>
          <Text style={s.onlineTxt}>{barbers.filter(b=>b.status==="available").length} Online</Text>
        </View>
      </View>

      {surgeActive && (
        <TouchableOpacity style={s.surgeBanner} onPress={() => navigation.navigate("Membership")}>
          <Text style={{ color: C.orange, fontWeight:"700", fontSize:12 }}>⚡ 1.4× Surge active  ·  </Text>
          <Text style={{ color: C.yellow, fontSize:12 }}>Remove with Pro →</Text>
        </TouchableOpacity>
      )}

      {/* Filters */}
      <View style={s.filterRow}>
        {["all","available","busy"].map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter===f && s.filterBtnActive]} onPress={()=>setFilter(f)}>
            <Text style={[s.filterTxt, filter===f && s.filterTxtActive]}>{f.charAt(0).toUpperCase()+f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[s.filterBtn, womensOnly && s.filterBtnWomens]} onPress={()=>setWomensOnly(w=>!w)}>
          <Text style={[s.filterTxt, womensOnly && s.filterTxtWomens]}>♀ Women's</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.filterBtn, femaleOnly && s.filterBtnFemale]} onPress={()=>setFemaleOnly(f=>!f)}>
          <Text style={[s.filterTxt, femaleOnly && s.filterTxtFemale]}>👩 Female</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator color={C.yellow} style={{ marginTop: 60 }} />
        : <FlatList data={filtered} keyExtractor={b=>b.id} renderItem={renderBarber}
            contentContainerStyle={{ padding: 24, paddingTop: 8 }}
            ListFooterComponent={
              <View style={s.barberCTA}>
                <Text style={{ color: "#9A5CFF", fontWeight:"700", fontSize:13 }}>Are you a barber?</Text>
                <Text style={{ color:C.muted, fontSize:12, marginTop:3 }}>Register to start taking bookings →</Text>
              </View>
            }
          />
      }
    </View>
  );
}

function avatarColor(id) {
  const colors = ["#FF6B35","#6B35FF","#35FF6B","#FF35B4","#35B4FF"];
  return colors[id?.charCodeAt(0) % colors.length] || colors[0];
}

const s = StyleSheet.create({
  wrap:           { flex: 1, backgroundColor: C.dark },
  header:         { flexDirection:"row", alignItems:"center", justifyContent:"space-between",
                    padding:24, paddingTop:56, borderBottomWidth:1, borderColor:C.border },
  back:           { width:36, height:36, borderRadius:18, backgroundColor:"rgba(255,255,255,0.07)",
                    alignItems:"center", justifyContent:"center" },
  backTxt:        { color:C.text, fontSize:18 },
  title:          { fontSize:13, fontWeight:"700", color:C.muted, letterSpacing:1.5, textTransform:"uppercase" },
  onlinePill:     { backgroundColor:"rgba(77,255,145,0.12)", borderWidth:1,
                    borderColor:"rgba(77,255,145,0.3)", paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  onlineTxt:      { color:C.green, fontSize:11, fontWeight:"700" },
  surgeBanner:    { flexDirection:"row", alignItems:"center", backgroundColor:"rgba(255,107,53,0.08)",
                    borderWidth:1, borderColor:"rgba(255,107,53,0.25)", margin:16, borderRadius:12, padding:12 },
  filterRow:      { flexDirection:"row", gap:8, paddingHorizontal:24, paddingBottom:12 },
  filterBtn:      { paddingHorizontal:16, paddingVertical:8, borderRadius:20,
                    borderWidth:1, borderColor:C.border },
  filterBtnActive:{ backgroundColor:C.yellow, borderColor:C.yellow },
  filterTxt:      { color:C.muted, fontSize:12, fontWeight:"700" },
  filterTxtActive:  { color:C.dark },
  filterBtnWomens:  { backgroundColor:"rgba(255,105,180,0.15)", borderColor:"rgba(255,105,180,0.5)" },
  filterTxtWomens:  { color:"#FF69B4" },
  filterBtnFemale:  { backgroundColor:"rgba(156,39,176,0.15)", borderColor:"rgba(156,39,176,0.5)" },
  filterTxtFemale:  { color:"#CE93D8" },
  womensBadge:      { fontSize:10, fontWeight:"800", color:"#fff", backgroundColor:"#C2185B",
                      alignSelf:"flex-start", paddingHorizontal:10, paddingVertical:3,
                      borderRadius:6, letterSpacing:1 },
  femaleBadge:      { fontSize:10, fontWeight:"800", color:"#fff", backgroundColor:"#7B1FA2",
                      alignSelf:"flex-start", paddingHorizontal:10, paddingVertical:3,
                      borderRadius:6, letterSpacing:1 },
  card:           { backgroundColor:C.card, borderWidth:1, borderColor:C.border,
                    borderRadius:20, padding:18, marginBottom:14 },
  featuredCard:   { borderColor:"rgba(232,255,71,0.3)", backgroundColor:"rgba(232,255,71,0.04)" },
  featuredBadge:  { fontSize:10, fontWeight:"800", color:C.dark, backgroundColor:C.yellow,
                    alignSelf:"flex-start", paddingHorizontal:10, paddingVertical:3,
                    borderRadius:6, marginBottom:8, letterSpacing:1 },
  row:            { flexDirection:"row", alignItems:"center", gap:12, marginBottom:14 },
  avatar:         { width:52, height:52, borderRadius:16, alignItems:"center", justifyContent:"center" },
  avatarTxt:      { color:"#fff", fontWeight:"800", fontSize:16 },
  dot:            { width:8, height:8, borderRadius:4 },
  name:           { fontSize:16, fontWeight:"700", color:C.text, flex:1 },
  spec:           { fontSize:12, color:C.muted, marginTop:2 },
  rating:         { fontSize:12, color:C.muted, marginTop:4 },
  chips:          { flexDirection:"row", gap:8 },
  chip:           { flex:1, backgroundColor:"rgba(255,255,255,0.04)", borderWidth:1,
                    borderColor:C.border, borderRadius:10, padding:10, alignItems:"center" },
  chipAccent:     { backgroundColor:"rgba(232,255,71,0.07)", borderColor:"rgba(232,255,71,0.2)" },
  chipL:          { fontSize:10, color:C.muted, letterSpacing:0.8 },
  chipV:          { fontSize:14, fontWeight:"700", color:C.text, marginTop:2 },
  barberCTA:      { backgroundColor:"rgba(107,53,255,0.06)", borderWidth:1,
                    borderColor:"rgba(107,53,255,0.18)", borderRadius:16, padding:16, alignItems:"center" },
});
