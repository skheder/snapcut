import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, TextInput } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { createBooking } from "../lib/api";
import { C } from "../lib/theme";

export default function CheckoutScreen({ route, navigation }) {
  const { barber, svcId, addons, tipAmt, total } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [address,  setAddress]  = useState("");
  const [loading,  setLoading]  = useState(false);

  async function pay() {
    if (!address.trim()) return Alert.alert("Please enter your address");
    setLoading(true);
    try {
      // 1. Create booking on backend — returns Stripe client_secret
      const { data } = await createBooking({
        barber_id:  barber.id,
        service_id: svcId,
        addon_ids:  addons,
        tip_amount: tipAmt,
        address:    address.trim(),
      });

      // 2. Init Stripe payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.client_secret,
        merchantDisplayName: "SnapCut",
        style: "alwaysDark",
      });
      if (initError) throw new Error(initError.message);

      // 3. Show the Stripe payment sheet (card entry UI)
      const { error: payError } = await presentPaymentSheet();
      if (payError) {
        if (payError.code === "Canceled") return; // user dismissed
        throw new Error(payError.message);
      }

      // 4. Payment confirmed — go to live tracking
      navigation.replace("Tracking", { booking: data.booking, barber });

    } catch (e) {
      Alert.alert("Payment failed", e.message || "Please try again");
    } finally { setLoading(false); }
  }

  const LABELS = {
    cut:"Haircut", fade:"Fade", "cut-beard":"Cut + Beard", deluxe:"Deluxe"
  };
  const ADDON_LABELS = {
    shampoo:"Shampoo & Style", serum:"Hair Serum", "hot-towel":"Hot Towel"
  };

  return (
    <View style={{flex:1,backgroundColor:C.dark}}>
      <ScrollView contentContainerStyle={s.inner}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.heading}>Confirm Booking</Text>

        {/* Summary card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Booking Summary</Text>
          <Row label="Barber"   value={barber.users?.name} />
          <Row label="Service"  value={LABELS[svcId] || svcId} />
          {addons.length > 0 &&
            <Row label="Add-ons" value={addons.map(a=>ADDON_LABELS[a]||a).join(", ")} />}
          <Row label="Tip"      value={`$${tipAmt.toFixed(2)}`} />
          <View style={s.divider} />
          <View style={{flexDirection:"row",justifyContent:"space-between"}}>
            <Text style={{color:C.muted,fontSize:14}}>Total</Text>
            <Text style={{color:C.yellow,fontSize:22,fontWeight:"900"}}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Address */}
        <Text style={s.sectionLabel}>Your address</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. 12 Main St, Sydney NSW 2000"
          placeholderTextColor={C.muted}
          value={address}
          onChangeText={setAddress}
          multiline
        />

        <View style={s.note}>
          <Text style={s.noteTxt}>💳  Your card is held, not charged, until the cut is complete.</Text>
        </View>
      </ScrollView>

      <View style={s.bar}>
        <TouchableOpacity style={s.payBtn} onPress={pay} disabled={loading}>
          {loading
            ? <ActivityIndicator color={C.dark} />
            : <Text style={s.payBtnTxt}>Pay ${total.toFixed(2)} securely</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={{flexDirection:"row",justifyContent:"space-between",marginBottom:10}}>
      <Text style={{color:C.muted,fontSize:13}}>{label}</Text>
      <Text style={{color:C.text,fontSize:13,fontWeight:"600",maxWidth:"60%",textAlign:"right"}}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  inner:        { padding:24, paddingTop:56 },
  back:         { width:36,height:36,borderRadius:18,backgroundColor:"rgba(255,255,255,0.07)",
                  alignItems:"center",justifyContent:"center",marginBottom:20 },
  backTxt:      { color:C.text, fontSize:18 },
  heading:      { fontSize:28,fontWeight:"900",color:C.text,letterSpacing:-0.5,marginBottom:24 },
  card:         { backgroundColor:C.card,borderWidth:1,borderColor:C.border,
                  borderRadius:20,padding:20,marginBottom:24 },
  cardTitle:    { fontSize:11,fontWeight:"700",color:C.muted,letterSpacing:1.5,
                  textTransform:"uppercase",marginBottom:16 },
  divider:      { height:1,backgroundColor:C.border,marginVertical:14 },
  sectionLabel: { fontSize:11,fontWeight:"700",color:C.muted,letterSpacing:1.5,
                  textTransform:"uppercase",marginBottom:10 },
  input:        { backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:14,
                  padding:16,color:C.text,fontSize:15,minHeight:60,marginBottom:16 },
  note:         { backgroundColor:"rgba(232,255,71,0.05)",borderWidth:1,
                  borderColor:"rgba(232,255,71,0.15)",borderRadius:12,padding:14 },
  noteTxt:      { color:C.muted,fontSize:13,lineHeight:18 },
  bar:          { backgroundColor:"rgba(10,10,15,0.97)",borderTopWidth:1,borderColor:C.border,
                  padding:20,paddingBottom:36 },
  payBtn:       { backgroundColor:C.yellow,borderRadius:14,padding:18,alignItems:"center" },
  payBtnTxt:    { color:C.dark,fontWeight:"800",fontSize:15 },
});
