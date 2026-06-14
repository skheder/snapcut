const router   = require("express").Router();
const stripe   = require("../lib/stripe");
const supabase = require("../lib/supabase");
const { authenticate, requireBarber } = require("../middleware/auth");

// POST /payments/connect — start Stripe Connect onboarding for barber
router.post("/connect", authenticate, requireBarber, async (req, res) => {
  try {
  const account = await stripe.accounts.create({
    type: "express",
    capabilities: { transfers: { requested: true } },
    business_type: "individual",
  });

  await supabase.from("barbers")
    .update({ stripe_account_id: account.id, stripe_onboarding_complete: false })
    .eq("user_id", req.user.id);

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: "https://snapcut-production-8e02.up.railway.app/barber/connect/refresh",
    return_url: "https://snapcut-production-8e02.up.railway.app/barber/connect/complete",
    type: "account_onboarding",
  });

  res.json({ url: accountLink.url });
  } catch (err) {
    console.error("Stripe connect error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /payments/connect/status
router.get("/connect/status", authenticate, requireBarber, async (req, res) => {
  const { data: barber } = await supabase.from("barbers")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("user_id", req.user.id).single();
  if (!barber?.stripe_account_id) return res.json({ connected: false });
  const account  = await stripe.accounts.retrieve(barber.stripe_account_id);
  const complete = account.details_submitted;
  if (complete && !barber.stripe_onboarding_complete) {
    await supabase.from("barbers")
      .update({ stripe_onboarding_complete: true }).eq("user_id", req.user.id);
  }
  res.json({ connected: true, complete });
});


// GET /payments/earnings
router.get("/earnings", authenticate, requireBarber, async (req, res) => {
  const { data: barber } = await supabase.from("barbers")
    .select("id").eq("user_id", req.user.id).single();
  const { data } = await supabase.from("bookings")
    .select("total_amount, platform_fee, tip_amount, created_at")
    .eq("barber_id", barber.id).eq("status", "completed");

  const earned   = data.reduce((s, b) => s + (b.total_amount - b.platform_fee), 0);
  const tips     = data.reduce((s, b) => s + b.tip_amount, 0);
  res.json({ totalEarned: earned, totalTips: tips, totalBookings: data.length });
});

module.exports = router;
