import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, ActivityIndicator } from "react-native";
import { getMySubscription, checkoutSubscription, cancelSubscription } from "../lib/api";
import { C } from "../lib/theme";

const PLANS = [
  { id:"basic", label:"Basic",  price:0,  emoji:"",   perks:["Standard booking","Surge pricing applies","No free cuts"] },
  { id:"pro",   label:"Pro",    price:12, emoji:"⚡",  perks:["1 free cut/month","No surge pricing","Deluxe service unlocked","Priority matching"], popular:true },
  { id:"vip",   label:"VIP",    price:29, emoji:"👑",  perks:["3 free cuts/month","No surge pricing","Skip the queue","Home visit included","Dedicated barber"] },
];

export default function MembershipScreen({ navigation }) {
  const [current, setCurrent] = useState("basic");
  const [selected, setSelected] = useState("pro");
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    getMySubscription()
      .then(({ data }) => { setCurrent(data.plan||"basic"); setSelected(data.plan||"pro"); })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  async function subscribe() {
    if (selected === "basic") return navigation.goBack();
    if (selected === current) return Alert.alert("You're already on this plan");
    setLoading(true);
    try {
      const { data } = await checkoutSubscription(selected);
      // Open Stripe Checkout in browser
      await Linking.openURL(data.url);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.error || "Please try again");
    } finally { setLoading(false); }
  }

  async function cancel() {
    Alert.alert("Cancel subscription?",
      "You'll keep access until the end of your billing period.", [
      { text: "Keep it", style:"cancel" },
      { text: "Cancel", style:"destructive", onPress: async () => {
        try {
          await cancelSubscription();
          setCurrent("basic");
          Alert.alert("Cancelled", "Your plan will end at the next billing date.");
        } catch { Alert.alert("Could not cancel. Contact support."); }
      }},
    ]);
  }

  if (fetching) return <View style={{flex:1,backgroundColor:C.dark,alignItems:"center",justifyContent:"center"}}><ActivityIndicator color={C.yellow}/></View>;

  return (
    <ScrollView style={s.wrap} contentContainerStyle={s.inner}>
      <TouchableOpacity onPress={()=>navigation.goBack()} style={s.back}>
        <Text style={s.backTxt}>←</Text>
      </TouchableOpacity>

      <Text style={s.eyebrow}>SNAPCUT PASS</Text>
      <Text style={s.heading}>Save every cut.</Text>
      <Text style={s.sub}>Subscribe and never pay surge pricing again.</Text>

      {PLANS.map(p => {
        const isSelected = selected === p.id;
        const isCurrent  = current  === p.id;
        return (
          <TouchableOpacity key={p.id}
            style={[s.planCard, isSelected && s.planCardActive]}
            onPress={() => setSelected(p.id)}>
            {p.popular && <Text style={s.popularBadge}>POPULAR</Text>}
            {isCurrent  && <Text style={s.currentBadge}>CURRENT</Text>}
            <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start"}}>
              <View>
                <Text style={s.planLabel}>{p.emoji} {p.label}</Text>
                <Text style={[s.planPrice, isSelected && {color:C.yellow}]}>
                  {p.price===0 ? "Free" : `$${p.price}/mo`}
                </Text>
              </View>
              <View style={[s.radio, isSelected && s.radioActive]}>
                {isSelected && <View style={s.radioDot}/>}
              </View>
            </View>
            <View style={s.divider}/>
            {p.perks.map(pk=>(
              <Text key={pk} style={s.perk}>✓  {pk}</Text>
            ))}
          </TouchableOpacity>
        );
      })}

      {/* Revenue model card (visible to app builders / barbers) */}
      <View style={s.revenueCard}>
        <Text style={s.revenueTitle}>PLATFORM REVENUE</Text>
        {[["20% booking fee","Every transaction"],["Subscriptions","$12–29/mo per user"],
          ["Surge pricing","×1.4 at peak hours"],["Add-on upsells","$5–8 per booking"],
          ["Featured listings","Barbers pay to rank"]].map(([a,b])=>(
          <View key={a} style={{flexDirection:"row",justifyContent:"space-between",marginBottom:7}}>
            <Text style={{color:"#555",fontSize:12}}>{a}</Text>
            <Text style={{color:"#444",fontSize:11,fontWeight:"600"}}>{b}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.btn} onPress={subscribe} disabled={loading}>
        {loading ? <ActivityIndicator color={C.dark}/>
          : <Text style={s.btnTxt}>
              {selected==="basic" ? "Continue Free" : `Subscribe · $${PLANS.find(p=>p.id===selected)?.price}/mo`}
            </Text>}
      </TouchableOpacity>
      <Text style={s.fine}>Cancel anytime · Billed monthly · Stripe secure checkout</Text>

      {current !== "basic" && (
        <TouchableOpacity onPress={cancel} style={{marginTop:12,alignItems:"center"}}>
          <Text style={{color:C.muted,fontSize:13}}>Cancel current subscription</Text>
        </TouchableOpacity>
      )}
      <View style={{height:40}}/>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:         { flex:1, backgroundColor:C.dark },
  inner:        { padding:24, paddingTop:56 },
  back:         { width:36,height:36,borderRadius:18,backgroundColor:"rgba(255,255,255,0.07)",
                  alignItems:"center",justifyContent:"center",marginBottom:24 },
  backTxt:      { color:C.text, fontSize:18 },
  eyebrow:      { fontSize:11,fontWeight:"700",color:C.yellow,letterSpacing:2,marginBottom:8 },
  heading:      { fontSize:30,fontWeight:"900",color:C.text,letterSpacing:-0.5,marginBottom:6 },
  sub:          { fontSize:14,color:C.muted,marginBottom:28 },
  planCard:     { backgroundColor:C.card,borderWidth:1,borderColor:C.border,
                  borderRadius:20,padding:20,marginBottom:12,position:"relative" },
  planCardActive:{ borderColor:C.yellow,backgroundColor:"rgba(232,255,71,0.05)" },
  popularBadge: { position:"absolute",top:-1,right:16,backgroundColor:C.yellow,color:C.dark,
                  fontSize:9,fontWeight:"800",paddingHorizontal:10,paddingVertical:3,
                  borderRadius:"0 0 8px 8px",letterSpacing:1 },
  currentBadge: { position:"absolute",top:-1,left:16,backgroundColor:C.green,color:C.dark,
                  fontSize:9,fontWeight:"800",paddingHorizontal:10,paddingVertical:3,
                  borderRadius:"0 0 8px 8px",letterSpacing:1 },
  planLabel:    { fontSize:16,fontWeight:"800",color:C.text },
  planPrice:    { fontSize:22,fontWeight:"900",color:C.text,letterSpacing:-0.5,marginTop:4 },
  radio:        { width:22,height:22,borderRadius:11,borderWidth:2,borderColor:C.faint,
                  alignItems:"center",justifyContent:"center" },
  radioActive:  { borderColor:C.yellow,backgroundColor:C.yellow },
  radioDot:     { width:10,height:10,borderRadius:5,backgroundColor:C.dark },
  divider:      { height:1,backgroundColor:C.border,marginVertical:14 },
  perk:         { fontSize:13,color:"#aaa",marginBottom:6 },
  revenueCard:  { backgroundColor:"rgba(255,255,255,0.02)",borderWidth:1,borderColor:"rgba(255,255,255,0.05)",
                  borderRadius:14,padding:16,marginTop:4,marginBottom:20 },
  revenueTitle: { fontSize:10,fontWeight:"700",color:"#333",letterSpacing:1.5,marginBottom:12 },
  btn:          { backgroundColor:C.yellow,borderRadius:14,padding:18,alignItems:"center" },
  btnTxt:       { color:C.dark,fontWeight:"800",fontSize:15 },
  fine:         { color:C.muted,fontSize:11,textAlign:"center",marginTop:10 },
});
