import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { getMySubscription } from "../lib/api";
import { C } from "../lib/theme";

const SURGE = 1.4;
const SERVICES = [
  { id:"cut",       label:"Haircut",     icon:"✂️", price:0  },
  { id:"fade",      label:"Fade",        icon:"⚡", price:5  },
  { id:"cut-beard", label:"Cut + Beard", icon:"🪒", price:15 },
  { id:"deluxe",    label:"Deluxe",      icon:"👑", price:25, pro:true },
];
const ADDONS = [
  { id:"shampoo",   label:"Shampoo & Style", price:8,  icon:"🚿" },
  { id:"serum",     label:"Hair Serum",       price:6,  icon:"✨" },
  { id:"hot-towel", label:"Hot Towel",        price:5,  icon:"🔥" },
];
const TIP_PCTS = [0,10,15,20,25];

export default function BarberScreen({ route, navigation }) {
  const barber = route.params?.barber;
  const [plan,   setPlan]    = useState("basic");
  const [svcId,  setSvcId]   = useState("cut");
  const [addons, setAddons]  = useState([]);
  const [tipPct, setTipPct]  = useState(15);

  const isPro       = plan === "pro" || plan === "vip";
  const surgeActive = !isPro;

  useEffect(() => {
    getMySubscription().then(({ data }) => setPlan(data.plan || "basic")).catch(() => {});
  }, []);

  const svc      = SERVICES.find(s => s.id === svcId);
  const base     = barber.base_price + svc.price;
  const surgeAmt = surgeActive ? base * (SURGE - 1) : 0;
  const addonAmt = addons.reduce((s,id) => s + (ADDONS.find(a=>a.id===id)?.price||0), 0);
  const subtotal = base + surgeAmt + addonAmt;
  const tipAmt   = (subtotal * tipPct) / 100;
  const total    = subtotal + tipAmt;

  function toggleAddon(id) {
    setAddons(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  }

  function bookNow() {
    if (barber.status !== "available") return Alert.alert("Barber is currently unavailable");
    navigation.navigate("Checkout", {
      barber, svcId, addons, tipAmt: parseFloat(tipAmt.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    });
  }

  return (
    <View style={{ flex:1, backgroundColor:C.dark }}>
      <ScrollView contentContainerStyle={s.inner}>
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>

        {/* Profile card */}
        <View style={s.profile}>
          <View style={[s.avatar, { backgroundColor: "#FF6B35" }]}>
            <Text style={s.avatarTxt}>{(barber.users?.name||"?").slice(0,2).toUpperCase()}</Text>
          </View>
          <Text style={s.name}>{barber.users?.name}</Text>
          <Text style={s.spec}>{barber.specialty}</Text>
          <Text style={s.rating}>★ {Number(barber.rating).toFixed(1)}  ·  {barber.total_cuts} cuts</Text>
          <View style={s.statsRow}>
            {[["$"+barber.base_price,"Base price"],[(barber.eta_minutes||10)+" min","ETA"]].map(([n,l])=>(
              <View key={l} style={s.statBox}>
                <Text style={s.statN}>{n}</Text>
                <Text style={s.statL}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Surge */}
        {surgeActive && (
          <TouchableOpacity style={s.surgeBanner} onPress={()=>navigation.navigate("Membership")}>
            <Text style={{color:C.orange,fontWeight:"700",fontSize:12}}>⚡ Surge ×1.4 active  ·  </Text>
            <Text style={{color:C.yellow,fontSize:12}}>Save ${(barber.base_price*(SURGE-1)).toFixed(0)} with Pro →</Text>
          </TouchableOpacity>
        )}

        {/* Services */}
        <Text style={s.sectionLabel}>Service</Text>
        <View style={s.grid}>
          {SERVICES.map(sv => {
            const locked  = sv.pro && !isPro;
            const active  = svcId === sv.id;
            return (
              <TouchableOpacity key={sv.id}
                style={[s.svcCard, active && s.svcCardActive, locked && { opacity:0.45 }]}
                onPress={() => !locked && setSvcId(sv.id)}>
                {locked && <Text style={s.proBadge}>PRO</Text>}
                <Text style={s.svcIcon}>{sv.icon}</Text>
                <Text style={[s.svcLabel, active && { color:C.yellow }]}>{sv.label}</Text>
                <Text style={s.svcPrice}>{sv.price===0?"Included":`+$${sv.price}`}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add-ons */}
        <Text style={s.sectionLabel}>Add-ons</Text>
        {ADDONS.map(a => (
          <TouchableOpacity key={a.id} style={s.addonRow} onPress={()=>toggleAddon(a.id)}>
            <Text style={s.addonIcon}>{a.icon}</Text>
            <View style={{flex:1}}>
              <Text style={s.addonLabel}>{a.label}</Text>
              <Text style={s.addonPrice}>+${a.price}</Text>
            </View>
            <View style={[s.checkbox, addons.includes(a.id) && s.checkboxActive]}>
              {addons.includes(a.id) && <Text style={{color:C.dark,fontWeight:"800",fontSize:12}}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}

        {/* Tip */}
        <Text style={s.sectionLabel}>Tip</Text>
        <View style={s.tipRow}>
          {TIP_PCTS.map(p => (
            <TouchableOpacity key={p} style={[s.tipBtn, tipPct===p && s.tipBtnActive]} onPress={()=>setTipPct(p)}>
              <Text style={[s.tipTxt, tipPct===p && {color:C.dark}]}>{p===0?"None":`${p}%`}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{height:140}} />
      </ScrollView>

      {/* Sticky checkout bar */}
      <View style={s.bar}>
        <View style={{flexDirection:"row",justifyContent:"space-between",marginBottom:8}}>
          {[["Service","$"+base.toFixed(2)],
            surgeActive?["Surge","$"+surgeAmt.toFixed(2)]:null,
            addonAmt?["Add-ons","$"+addonAmt.toFixed(2)]:null,
            ["Tip","$"+tipAmt.toFixed(2)],
          ].filter(Boolean).map(([l,v])=>(
            <Text key={l} style={{color:C.muted,fontSize:12}}>{l}: <Text style={{color:C.text}}>{v}</Text></Text>
          ))}
        </View>
        <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <Text style={{color:C.muted,fontSize:13}}>Total</Text>
          <Text style={{color:C.yellow,fontSize:22,fontWeight:"900"}}>${total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={s.bookBtn} onPress={bookNow}>
          <Text style={s.bookBtnTxt}>Confirm & Pay ${total.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  inner:        { padding:24, paddingTop:56 },
  back:         { width:36,height:36,borderRadius:18,backgroundColor:"rgba(255,255,255,0.07)",
                  alignItems:"center",justifyContent:"center",marginBottom:20 },
  backTxt:      { color:C.text, fontSize:18 },
  profile:      { backgroundColor:C.card,borderWidth:1,borderColor:C.border,
                  borderRadius:22,padding:24,alignItems:"center",marginBottom:16 },
  avatar:       { width:72,height:72,borderRadius:22,alignItems:"center",justifyContent:"center",marginBottom:14 },
  avatarTxt:    { color:"#fff",fontWeight:"800",fontSize:22 },
  name:         { fontSize:22,fontWeight:"800",color:C.text,letterSpacing:-0.5 },
  spec:         { fontSize:13,color:C.muted,marginTop:4 },
  rating:       { fontSize:12,color:C.muted,marginTop:6,marginBottom:16 },
  statsRow:     { flexDirection:"row",gap:10,width:"100%" },
  statBox:      { flex:1,backgroundColor:"rgba(255,255,255,0.04)",borderRadius:12,
                  padding:12,borderWidth:1,borderColor:C.border },
  statN:        { fontSize:18,fontWeight:"800",color:C.text },
  statL:        { fontSize:10,color:C.muted,marginTop:2 },
  surgeBanner:  { flexDirection:"row",backgroundColor:"rgba(255,107,53,0.08)",
                  borderWidth:1,borderColor:"rgba(255,107,53,0.25)",borderRadius:12,
                  padding:12,marginBottom:20,alignItems:"center" },
  sectionLabel: { fontSize:11,fontWeight:"700",color:C.muted,letterSpacing:1.5,
                  textTransform:"uppercase",marginBottom:12 },
  grid:         { flexDirection:"row",flexWrap:"wrap",gap:10,marginBottom:24 },
  svcCard:      { width:"47%",backgroundColor:C.card,borderWidth:1,borderColor:C.border,
                  borderRadius:16,padding:14,position:"relative" },
  svcCardActive:{ borderColor:C.yellow,backgroundColor:"rgba(232,255,71,0.07)" },
  proBadge:     { position:"absolute",top:8,right:8,backgroundColor:C.yellow,color:C.dark,
                  fontSize:9,fontWeight:"800",paddingHorizontal:6,paddingVertical:2,borderRadius:6 },
  svcIcon:      { fontSize:22,marginBottom:6 },
  svcLabel:     { fontSize:14,fontWeight:"600",color:C.text },
  svcPrice:     { fontSize:11,color:C.muted,marginTop:3 },
  addonRow:     { flexDirection:"row",alignItems:"center",gap:12,paddingVertical:14,
                  borderBottomWidth:1,borderColor:C.border },
  addonIcon:    { fontSize:20 },
  addonLabel:   { fontSize:14,fontWeight:"600",color:C.text },
  addonPrice:   { fontSize:12,color:C.muted,marginTop:2 },
  checkbox:     { width:22,height:22,borderRadius:6,borderWidth:2,borderColor:C.faint,
                  alignItems:"center",justifyContent:"center" },
  checkboxActive:{ backgroundColor:C.yellow,borderColor:C.yellow },
  tipRow:       { flexDirection:"row",gap:8,flexWrap:"wrap",marginBottom:8 },
  tipBtn:       { paddingHorizontal:14,paddingVertical:8,borderRadius:20,
                  borderWidth:1,borderColor:C.border },
  tipBtnActive: { backgroundColor:C.yellow,borderColor:C.yellow },
  tipTxt:       { color:C.muted,fontWeight:"700",fontSize:12 },
  bar:          { position:"absolute",bottom:0,left:0,right:0,backgroundColor:"rgba(10,10,15,0.97)",
                  borderTopWidth:1,borderColor:C.border,padding:20,paddingBottom:36 },
  bookBtn:      { backgroundColor:C.yellow,borderRadius:14,padding:18,alignItems:"center" },
  bookBtnTxt:   { color:C.dark,fontWeight:"800",fontSize:15 },
});
