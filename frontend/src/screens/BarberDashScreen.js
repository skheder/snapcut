import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList,
  Alert, ActivityIndicator, RefreshControl } from "react-native";
import * as Location from "expo-location";
import { useAuth } from "../hooks/useAuth";
import { getBarberBookings, updateBookingStatus, updateBarberStatus,
  updateBarberLocation, getEarnings, getConnectStatus, startStripeConnect,
  getMyBarberProfile, updateBarberProfile } from "../lib/api";
import { C } from "../lib/theme";
import { Linking } from "react-native";

const STATUS_FLOW = {
  pending:     { next:"accepted",    label:"Accept",      color: C.yellow },
  accepted:    { next:"en_route",    label:"Start Drive",  color: C.green  },
  en_route:    { next:"arrived",     label:"Mark Arrived", color: C.green  },
  arrived:     { next:"in_progress", label:"Start Cut",    color: C.purple },
  in_progress: { next:"completed",   label:"Mark Done ✓",  color: C.yellow },
};

export default function BarberDashScreen() {
  const { logout } = useAuth();
  const [bookings,   setBookings]   = useState([]);
  const [earnings,   setEarnings]   = useState(null);
  const [online,     setOnline]     = useState(false);
  const [connected,  setConnected]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,          setTab]          = useState("jobs"); // jobs | earnings
  const [acceptsWomen, setAcceptsWomen] = useState(false);
  const [isFemale,     setIsFemale]     = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ data: bk }, { data: ea }, { data: cs }, { data: profile }] = await Promise.all([
        getBarberBookings(), getEarnings(), getConnectStatus(), getMyBarberProfile(),
      ]);
      setBookings(bk);
      setEarnings(ea);
      setConnected(cs.connected);
      setOnline(profile.status === "available");
      setAcceptsWomen(!!profile.accepts_women);
      setIsFemale(!!profile.is_female);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Push GPS every 30 seconds when online
  useEffect(() => {
    if (!online) return;
    const iv = setInterval(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      updateBarberLocation(loc.coords.latitude, loc.coords.longitude).catch(()=>{});
    }, 10000);
    return () => clearInterval(iv);
  }, [online]);

  async function toggleOnline() {
    if (false) {
      return Alert.alert("Set up payouts first", "You need to connect Stripe before going online.", [
        { text:"Connect Stripe", onPress:connectStripe },
        { text:"Later", style:"cancel" },
      ]);
    }
    const newStatus = online ? "offline" : "available";
    try {
      await updateBarberStatus(newStatus);
      setOnline(!online);
    } catch (e) {
      Alert.alert("Status update failed", e?.response?.data?.error || e?.message || "Unknown error");
    }
  }

  async function connectStripe() {
    try {
      const { data } = await startStripeConnect();
      await Linking.openURL(data.url);
    } catch { Alert.alert("Could not connect Stripe. Try again."); }
  }

  async function toggleAcceptsWomen() {
    const newVal = !acceptsWomen;
    try {
      await updateBarberProfile({ accepts_women: newVal });
      setAcceptsWomen(newVal);
    } catch { Alert.alert("Could not update profile"); }
  }

  async function toggleIsFemale() {
    const newVal = !isFemale;
    try {
      await updateBarberProfile({ is_female: newVal });
      setIsFemale(newVal);
    } catch { Alert.alert("Could not update profile"); }
  }

  async function advance(booking) {
    const step = STATUS_FLOW[booking.status];
    if (!step) return;
    try {
      await updateBookingStatus(booking.id, step.next);
      setBookings(prev => prev.map(b => b.id===booking.id ? {...b,status:step.next} : b));
    } catch { Alert.alert("Could not update booking"); }
  }

  function renderBooking({ item: b }) {
    const step = STATUS_FLOW[b.status];
    const LABELS = { cut:"Haircut", fade:"Fade", "cut-beard":"Cut + Beard", deluxe:"Deluxe" };
    return (
      <View style={s.jobCard}>
        <View style={s.jobTop}>
          <Text style={s.customerName}>{b.users?.name || "Customer"}</Text>
          <View style={[s.statusPill, {backgroundColor: step ? step.color+"22" : "rgba(255,255,255,0.05)"}]}>
            <Text style={[s.statusTxt, {color: step ? step.color : C.muted}]}>{b.status.replace("_"," ")}</Text>
          </View>
        </View>
        <Text style={s.jobDetail}>{LABELS[b.service_id]||b.service_id}  ·  ${Number(b.total_amount).toFixed(2)}</Text>
        {b.address && <Text style={s.jobAddr}>📍 {b.address}</Text>}
        <Text style={s.jobPhone}>{b.users?.phone || ""}</Text>
        {step && (
          <TouchableOpacity style={[s.advanceBtn, {backgroundColor:step.color}]} onPress={()=>advance(b)}>
            <Text style={s.advanceTxt}>{step.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (loading) return (
    <View style={{flex:1,backgroundColor:C.dark,alignItems:"center",justifyContent:"center"}}>
      <ActivityIndicator color={C.yellow} />
    </View>
  );

  return (
    <View style={s.wrap}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.logo}>SnapCut ✂️</Text>
        <View style={{flexDirection:"row",gap:10}}>
          <TouchableOpacity style={[s.onlineBtn, online && s.onlineBtnActive]} onPress={toggleOnline}>
            <Text style={[s.onlineTxt, online && {color:C.dark}]}>{online?"● Online":"○ Offline"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => {
            await updateBarberStatus("offline").catch(()=>{});
            logout();
          }} style={s.logoutBtn}>
            <Text style={{color:C.muted,fontSize:12}}>Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stripe connect prompt */}
      {!connected && (
        <TouchableOpacity style={s.connectBanner} onPress={connectStripe}>
          <Text style={{color:C.yellow,fontWeight:"700",fontSize:13}}>⚡ Connect Stripe to get paid</Text>
          <Text style={{color:C.muted,fontSize:12,marginTop:3}}>Tap to set up payouts in 2 minutes →</Text>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={s.tabs}>
        {["jobs","earnings"].map(t=>(
          <TouchableOpacity key={t} style={[s.tab, tab===t && s.tabActive]} onPress={()=>setTab(t)}>
            <Text style={[s.tabTxt, tab===t && s.tabTxtActive]}>{t.charAt(0).toUpperCase()+t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "jobs" ? (
        <FlatList
          data={bookings.filter(b=>!["completed","cancelled"].includes(b.status))}
          keyExtractor={b=>b.id}
          renderItem={renderBooking}
          contentContainerStyle={{padding:20}}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor={C.yellow}/>}
          ListEmptyComponent={<Text style={{color:C.muted,textAlign:"center",marginTop:60}}>No active bookings</Text>}
        />
      ) : (
        <View style={{padding:24}}>
          <View style={s.earningsCard}>
            <Text style={s.earningsLabel}>TOTAL EARNED</Text>
            <Text style={s.earningsBig}>${Number(earnings?.totalEarned||0).toFixed(2)}</Text>
          </View>
          <View style={{flexDirection:"row",gap:12,marginTop:14}}>
            {[["Tips","$"+Number(earnings?.totalTips||0).toFixed(2)],
              ["Bookings", earnings?.totalBookings||0]].map(([l,v])=>(
              <View key={l} style={s.earningMini}>
                <Text style={{color:C.muted,fontSize:11,letterSpacing:1}}>{l}</Text>
                <Text style={{color:C.text,fontSize:20,fontWeight:"800",marginTop:4}}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={s.earningsNote}>
            <Text style={{color:C.muted,fontSize:12,lineHeight:18}}>
              💡 SnapCut takes a 20% platform fee from each booking.
              Your earnings above are your take-home after the fee.
              Payouts land in your Stripe account within 2 business days.
            </Text>
          </View>

          {/* Women's services toggle */}
          <TouchableOpacity style={s.womensToggle} onPress={toggleAcceptsWomen}>
            <View style={{flex:1}}>
              <Text style={{color:C.text,fontWeight:"700",fontSize:14}}>♀ Women's services</Text>
              <Text style={{color:C.muted,fontSize:12,marginTop:3}}>
                Show your profile in Women's filter searches
              </Text>
            </View>
            <View style={[s.togglePill, acceptsWomen && s.togglePillOn]}>
              <View style={[s.toggleThumb, acceptsWomen && s.toggleThumbOn]} />
            </View>
          </TouchableOpacity>

          {/* Female barber toggle */}
          <TouchableOpacity style={s.womensToggle} onPress={toggleIsFemale}>
            <View style={{flex:1}}>
              <Text style={{color:C.text,fontWeight:"700",fontSize:14}}>👩 I am a female barber</Text>
              <Text style={{color:C.muted,fontSize:12,marginTop:3}}>
                Appear in Female barber filter — for customers who prefer female-only service
              </Text>
            </View>
            <View style={[s.togglePill, isFemale && s.togglePillFemale]}>
              <View style={[s.toggleThumb, isFemale && s.toggleThumbOn]} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:           { flex:1, backgroundColor:C.dark },
  header:         { flexDirection:"row",justifyContent:"space-between",alignItems:"center",
                    padding:24,paddingTop:56,borderBottomWidth:1,borderColor:C.border },
  logo:           { fontSize:20,fontWeight:"900",color:C.text },
  onlineBtn:      { paddingHorizontal:14,paddingVertical:8,borderRadius:20,
                    borderWidth:1.5,borderColor:C.border },
  onlineBtnActive:{ backgroundColor:C.green,borderColor:C.green },
  onlineTxt:      { color:C.muted,fontWeight:"700",fontSize:13 },
  logoutBtn:      { width:36,height:36,borderRadius:18,backgroundColor:"rgba(255,255,255,0.06)",
                    alignItems:"center",justifyContent:"center" },
  connectBanner:  { backgroundColor:"rgba(232,255,71,0.07)",borderWidth:1,
                    borderColor:"rgba(232,255,71,0.2)",margin:16,borderRadius:14,padding:14 },
  tabs:           { flexDirection:"row",borderBottomWidth:1,borderColor:C.border },
  tab:            { flex:1,padding:16,alignItems:"center" },
  tabActive:      { borderBottomWidth:2,borderColor:C.yellow },
  tabTxt:         { color:C.muted,fontWeight:"700",fontSize:13 },
  tabTxtActive:   { color:C.yellow },
  jobCard:        { backgroundColor:C.card,borderWidth:1,borderColor:C.border,
                    borderRadius:18,padding:18,marginBottom:14 },
  jobTop:         { flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:8 },
  customerName:   { fontSize:16,fontWeight:"700",color:C.text },
  statusPill:     { paddingHorizontal:10,paddingVertical:4,borderRadius:20 },
  statusTxt:      { fontSize:11,fontWeight:"700",textTransform:"uppercase",letterSpacing:0.8 },
  jobDetail:      { fontSize:13,color:C.muted,marginBottom:6 },
  jobAddr:        { fontSize:12,color:C.muted,marginBottom:4 },
  jobPhone:       { fontSize:12,color:"#9A5CFF",marginBottom:14 },
  advanceBtn:     { borderRadius:12,padding:14,alignItems:"center" },
  advanceTxt:     { color:C.dark,fontWeight:"800",fontSize:14 },
  earningsCard:   { backgroundColor:C.card,borderWidth:1,borderColor:C.border,
                    borderRadius:20,padding:24 },
  earningsLabel:  { fontSize:11,fontWeight:"700",color:C.muted,letterSpacing:1.5 },
  earningsBig:    { fontSize:48,fontWeight:"900",color:C.yellow,letterSpacing:-2,marginTop:6 },
  earningMini:    { flex:1,backgroundColor:C.card,borderWidth:1,borderColor:C.border,
                    borderRadius:14,padding:14 },
  earningsNote:   { backgroundColor:"rgba(255,255,255,0.02)",borderRadius:12,
                    padding:14,marginTop:20,borderWidth:1,borderColor:C.border },
  womensToggle:   { flexDirection:"row",alignItems:"center",backgroundColor:C.card,
                    borderWidth:1,borderColor:C.border,borderRadius:16,padding:16,marginTop:14 },
  togglePill:     { width:44,height:26,borderRadius:13,backgroundColor:"rgba(255,255,255,0.1)",
                    justifyContent:"center",paddingHorizontal:3 },
  togglePillOn:     { backgroundColor:"#C2185B" },
  togglePillFemale: { backgroundColor:"#7B1FA2" },
  toggleThumb:    { width:20,height:20,borderRadius:10,backgroundColor:C.muted },
  toggleThumbOn:  { backgroundColor:"#fff",alignSelf:"flex-end" },
});
