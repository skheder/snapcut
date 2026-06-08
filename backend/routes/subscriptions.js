const router   = require("express").Router();
const stripe   = require("../lib/stripe");
const supabase = require("../lib/supabase");
const { authenticate } = require("../middleware/auth");

const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  vip: process.env.STRIPE_VIP_PRICE_ID,
};

// POST /subscriptions/checkout
router.post("/checkout", authenticate, async (req, res) => {
  const { plan } = req.body;
  if (!PRICE_IDS[plan]) return res.status(400).json({ error: "Invalid plan" });

  const { data: user } = await supabase.from("users")
    .select("stripe_customer_id, email, name").eq("id", req.user.id).single();

  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name });
    customerId = customer.id;
    await supabase.from("users").update({ stripe_customer_id: customerId }).eq("id", req.user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/subscription/success?plan=${plan}`,
    cancel_url:  `${process.env.FRONTEND_URL}/membership`,
    metadata: { user_id: req.user.id, plan },
  });

  res.json({ url: session.url });
});

// GET /subscriptions/me
router.get("/me", authenticate, async (req, res) => {
  const { data } = await supabase.from("subscriptions")
    .select("*").eq("user_id", req.user.id).eq("status", "active").single();
  res.json(data || { plan: "basic" });
});

// DELETE /subscriptions — cancel at period end
router.delete("/", authenticate, async (req, res) => {
  const { data: sub } = await supabase.from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", req.user.id).eq("status", "active").single();
  if (!sub) return res.status(404).json({ error: "No active subscription" });

  await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true });
  await supabase.from("subscriptions")
    .update({ cancel_at_period_end: true }).eq("stripe_subscription_id", sub.stripe_subscription_id);
  res.json({ ok: true });
});

module.exports = router;
