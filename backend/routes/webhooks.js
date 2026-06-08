const router   = require("express").Router();
const stripe   = require("../lib/stripe");
const supabase = require("../lib/supabase");

router.post("/stripe", require("express").raw({ type: "application/json" }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      if (s.mode !== "subscription") break;
      await supabase.from("subscriptions").upsert({
        user_id: s.metadata.user_id, plan: s.metadata.plan,
        stripe_subscription_id: s.subscription,
        stripe_customer_id: s.customer, status: "active",
        current_period_end: new Date(Date.now() + 30*24*60*60*1000),
      }, { onConflict: "user_id" });
      break;
    }
    case "customer.subscription.deleted":
      await supabase.from("subscriptions")
        .update({ status: "cancelled" })
        .eq("stripe_subscription_id", event.data.object.id);
      break;
    case "invoice.paid": {
      const inv = event.data.object;
      if (inv.subscription) {
        await supabase.from("subscriptions").update({
          status: "active",
          current_period_end: new Date(inv.lines.data[0]?.period?.end * 1000),
        }).eq("stripe_subscription_id", inv.subscription);
      }
      break;
    }
  }

  res.json({ received: true });
});

module.exports = router;
