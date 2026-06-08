import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { updateBookingStatus } from "../lib/api";
import { C } from "../lib/theme";

const STAGES = ["accepted","en_route","arrived","in_progress","completed"];
const STAGE_LABELS = {
  accepted:    "Booking accepted",
  en_route:    "Barber on the way",
  arrived:     "Barber arrived",
  in_progress: "Cut in progress",
  completed:   "All done! 🎉",
};

export default function TrackingScreen({ route, navigation }) {
  const { booking, barber } = route.params;
  const [status,      setStatus]      = useState(booking.status || "accepted");
  const [eta,         setEta]         = useState(barber.eta_minutes || 10);
  const [pulse,       setPulse]       = useState(false);
  const stageIdx = STAGES.indexOf(status);
  const progress = ((stageIdx + 1) / STAGES.length) * 100;

  // Countdown timer
  useEffect(() => {
    if (eta <= 0 || status !== "en_route") return;
    const t = setInterval(() => setEta(e => (e <= 1 ? (clearInterval(t), 0) : e - 1)), 60000);
    return () => clearInterval(t);
  }, [status]);

  // Pulse animation for live dot
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1400);
    return () => clearInterval(t);
  }, []);

  async function cancel() {
    Alert.alert("Cancel booking?", "Your card will not be charged.", [
      { text: "Keep it", style: "cancel" },
      { text: "Cancel", style: "destructive", onPress: async () => {
        try {
          await updateBookingStatus(booking.id, "cancelled");
          navigation.replace("Home");
        } catch { Alert.alert("Could not cancel. Please contact support."); }
      }},
    ]);
  }

  const isDone = status === "completed";

  return (
    <View style={s.wrap}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.logo}>SnapCut</Text>
        <View style={s.liveBadge}>
          <View style={[s.liveDot, pulse && s.liveDotPulse]} />
          <Text style={s.liveTxt}>LIVE</Text>
        </View>
      </View>

      <Text style={s.enRoute}>
        {isDone ? "Booking complete" : "En route to you"}
      </Text>
      <Text style={s.barberName}>{barber.users?.name}</Text>

      {/* ETA card */}
      <View style={s.etaCard}>
        <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
          <View>
            <Text style={s.etaBig}>{isDone ? "✓" : eta}</Text>
            <Text style={s.etaLabel}>{isDone ? "COMPLETE" : "MIN AWAY"}</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{(barber.users?.name||"?").slice(0,2).toUpperCase()}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={{flexDirection:"row",justifyContent:"space-between",marginTop:8}}>
          {STAGES.map((st,i) => (
            <Text key={st} style={{fontSize:9,color:i<=stageIdx?C.yellow:C.faint,letterSpacing:0.3}}>
              {st.replace("_"," ")}
            </Text>
          ))}
        </View>
      </View>

      {/* Status label */}
      <View style={s.statusBox}>
        <Text style={s.statusTxt}>{STAGE_LABELS[status] || "Waiting…"}</Text>
      </View>

      {/* Receipt */}
      <View style={s.receipt}>
        <Text style={s.receiptTitle}>Receipt</Text>
        {[
          ["Total charged", "$"+Number(booking.total_amount).toFixed(2)],
          ["Platform fee",  "Handled by SnapCut"],
          ["Tip",           "$"+Number(booking.tip_amount).toFixed(2)],
        ].map(([l,v])=>(
          <View key={l} style={{flexDirection:"row",justifyContent:"space-between",marginBottom:8}}>
            <Text style={{color:C.muted,fontSize:12}}>{l}</Text>
            <Text style={{color:C.text,fontSize:12,fontWeight:"600"}}>{v}</Text>
          </View>
        ))}
      </View>

      {!isDone
        ? <TouchableOpacity style={s.cancelBtn} onPress={cancel}>
            <Text style={s.cancelTxt}>Cancel Booking</Text>
          </TouchableOpacity>
        : <TouchableOpacity style={s.doneBtn} onPress={()=>navigation.replace("Home")}>
            <Text style={s.doneBtnTxt}>Back to Home</Text>
          </TouchableOpacity>
      }
    </View>
  );
}

const s = StyleSheet.create({
  wrap:          { flex:1, backgroundColor:C.dark, padding:24, paddingTop:56 },
  header:        { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:24 },
  logo:          { fontSize:18, fontWeight:"900", color:C.text },
  liveBadge:     { flexDirection:"row", alignItems:"center", gap:6,
                   backgroundColor:"rgba(77,255,145,0.1)", borderWidth:1,
                   borderColor:"rgba(77,255,145,0.3)", paddingHorizontal:12, paddingVertical:5, borderRadius:20 },
  liveDot:       { width:7, height:7, borderRadius:4, backgroundColor:C.green },
  liveDotPulse:  { shadowColor:C.green, shadowOpacity:0.8, shadowRadius:6, shadowOffset:{width:0,height:0} },
  liveTxt:       { color:C.green, fontSize:11, fontWeight:"700", letterSpacing:1 },
  enRoute:       { fontSize:12, color:C.muted, letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 },
  barberName:    { fontSize:24, fontWeight:"800", color:C.text, letterSpacing:-0.5, marginBottom:20 },
  etaCard:       { backgroundColor:C.card, borderWidth:1, borderColor:C.border,
                   borderRadius:22, padding:22, marginBottom:16 },
  etaBig:        { fontSize:58, fontWeight:"900", color:C.yellow, letterSpacing:-2, lineHeight:60 },
  etaLabel:      { fontSize:11, color:C.muted, letterSpacing:1.2, marginTop:2 },
  avatar:        { width:52, height:52, borderRadius:16, backgroundColor:C.orange,
                   alignItems:"center", justifyContent:"center" },
  avatarTxt:     { color:"#fff", fontWeight:"800", fontSize:16 },
  progressBg:    { height:4, backgroundColor:C.faint, borderRadius:4, overflow:"hidden" },
  progressFill:  { height:"100%", backgroundColor:C.yellow, borderRadius:4 },
  statusBox:     { backgroundColor:"rgba(232,255,71,0.06)", borderWidth:1,
                   borderColor:"rgba(232,255,71,0.15)", borderRadius:14, padding:14,
                   alignItems:"center", marginBottom:16 },
  statusTxt:     { color:C.yellow, fontWeight:"700", fontSize:15 },
  receipt:       { backgroundColor:C.card, borderWidth:1, borderColor:C.border,
                   borderRadius:18, padding:18, marginBottom:20 },
  receiptTitle:  { fontSize:11, fontWeight:"700", color:C.muted, letterSpacing:1.5,
                   textTransform:"uppercase", marginBottom:14 },
  cancelBtn:     { borderWidth:1.5, borderColor:"rgba(255,107,53,0.35)", borderRadius:14,
                   padding:16, alignItems:"center" },
  cancelTxt:     { color:C.orange, fontWeight:"700", fontSize:13, letterSpacing:0.5 },
  doneBtn:       { backgroundColor:C.yellow, borderRadius:14, padding:18, alignItems:"center" },
  doneBtnTxt:    { color:C.dark, fontWeight:"800", fontSize:15 },
});
