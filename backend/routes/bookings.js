const router   = require("express").Router();
const supabase = require("../lib/supabase");
const stripe   = require("../lib/stripe");
const { authenticate, requireBarber } = require("../middleware/auth");

const SURGE_MULT   = parseFloat(process.env.SURGE_MULTIPLIER || 1.4);
const SURGE_ACTIVE = process.env.SURGE_ACTIVE === "true";
const FEE_PCT      = parseFloat(process.env.PLATFORM_FEE_PERCENT || 0.20);

const SERVICE_PRICES = { cut: 0, fade: 5, "cut-beard": 15, deluxe: 25 };
const ADDON_PRICES   = { shampoo: 8, serum: 6, "hot-towel": 5 };

// POST /bookings
router.post("/", authenticate, async (req, res) => {
  const { barber_id, service_id, addon_ids = [], tip_amount = 0, address } = req.body;

  const { data: barber } = await supabase
    .from("barbers").select("*, users(name)").eq("id", barber_id).single();
  if (!barber) return res.status(404).json({ error: "Barber not found" });
  if (barber.status !== "available") return res.status(409).json({ error: "Barber unavailable" });

  if (barber.women_clients_only) {
    const { data: customer } = await supabase.from("users").select("gender").eq("id", req.user.id).single();
    if (customer?.gender !== "female")
      return res.status(403).json({ error: "This hairdresser accepts female clients only" });
  }

  const { data: sub } = await supabase.from("subscriptions")
    .select("plan").eq("user_id", req.user.id).eq("status", "active").single();
  const isPro   = sub?.plan === "pro" || sub?.plan === "vip";
  const surgeOn = SURGE_ACTIVE && !isPro;

  if (service_id === "deluxe" && !isPro)
    return res.status(403).json({ error: "Deluxe requires Pro subscription" });

  const basePrice  = barber.base_price + (SERVICE_PRICES[service_id] || 0);
  const surgeAmt   = surgeOn ? basePrice * (SURGE_MULT - 1) : 0;
  const addonAmt   = addon_ids.reduce((s, id) => s + (ADDON_PRICES[id] || 0), 0);
  const subtotal   = basePrice + surgeAmt + addonAmt;
  const feeCents   = Math.round(subtotal * FEE_PCT * 100);
  const totalCents = Math.round((subtotal + tip_amount) * 100);

  if (!barber.stripe_account_id)
    return res.status(400).json({ error: "Barber payment account not set up" });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: "usd",
    capture_method: "manual",          // hold funds, capture after cut complete
    automatic_payment_methods: { enabled: true },
    application_fee_amount: feeCents,
    transfer_data: { destination: barber.stripe_account_id },
    metadata: { customer_id: req.user.id, barber_id, service_id },
  });

  const { data: booking, error } = await supabase.from("bookings").insert({
    customer_id: req.user.id, barber_id, service_id, addon_ids,
    base_price: basePrice, surge_amount: surgeAmt, addon_amount: addonAmt,
    tip_amount, total_amount: subtotal + tip_amount,
    platform_fee: feeCents / 100, status: "pending",
    address, payment_intent_id: paymentIntent.id,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from("barbers").update({ status: "busy" }).eq("id", barber_id);

  res.status(201).json({ booking, client_secret: paymentIntent.client_secret });
});

// GET /bookings — customer history
router.get("/", authenticate, async (req, res) => {
  const { data, error } = await supabase.from("bookings")
    .select("*, barbers(*, users(name))")
    .eq("customer_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /bookings/barber — barber's jobs
router.get("/barber", authenticate, requireBarber, async (req, res) => {
  const { data: barber } = await supabase.from("barbers")
    .select("id").eq("user_id", req.user.id).single();
  const { data, error } = await supabase.from("bookings")
    .select("*, users(name, phone)").eq("barber_id", barber.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /bookings/:id/status
router.put("/:id/status", authenticate, async (req, res) => {
  const { status } = req.body;
  const allowed = ["accepted","en_route","arrived","in_progress","completed","cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const { data: booking } = await supabase.from("bookings")
    .select("*").eq("id", req.params.id).single();
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const updates = { status };
  if (status === "completed") updates.completed_at = new Date();

  await supabase.from("bookings").update(updates).eq("id", req.params.id);

  if (status === "completed") {
    try {
      await stripe.paymentIntents.capture(booking.payment_intent_id);
    } catch (stripeErr) {
      console.error("Stripe capture failed:", stripeErr.message);
    }
    await supabase.from("barbers")
      .update({ status: "available" })
      .eq("id", booking.barber_id);
  }
  if (status === "cancelled") {
    await stripe.paymentIntents.cancel(booking.payment_intent_id).catch(() => {});
    await supabase.from("barbers").update({ status: "available" }).eq("id", booking.barber_id);
  }

  res.json({ ok: true, status });
});

// POST /bookings/:id/review
router.post("/:id/review", authenticate, async (req, res) => {
  const { rating, text } = req.body;
  if (!rating || rating < 1 || rating > 5)
    return res.status(400).json({ error: "Rating must be 1–5" });

  const { data: booking } = await supabase.from("bookings")
    .select("*").eq("id", req.params.id).single();
  if (booking?.customer_id !== req.user.id)
    return res.status(403).json({ error: "Not your booking" });
  if (booking?.status !== "completed")
    return res.status(400).json({ error: "Booking not completed" });

  await supabase.from("bookings")
    .update({ review_rating: rating, review_text: text }).eq("id", req.params.id);

  // Recalculate barber average rating
  const { data: reviews } = await supabase.from("bookings")
    .select("review_rating").eq("barber_id", booking.barber_id).not("review_rating", "is", null);
  const avg = reviews.reduce((s, r) => s + r.review_rating, 0) / reviews.length;
  await supabase.from("barbers")
    .update({ rating: avg.toFixed(2), review_count: reviews.length })
    .eq("id", booking.barber_id);

  res.json({ ok: true });
});

module.exports = router;
