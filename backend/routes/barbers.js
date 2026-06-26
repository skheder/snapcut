const router   = require("express").Router();
const supabase = require("../lib/supabase");
const { authenticate, requireBarber } = require("../middleware/auth");

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, d2r = Math.PI / 180;
  const dLat = (lat2 - lat1) * d2r, dLng = (lng2 - lng1) * d2r;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*d2r)*Math.cos(lat2*d2r)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// GET /barbers — list available barbers
router.get("/", async (req, res) => {
  const { lat, lng, radius_km = 15, accepts_women } = req.query;
  let query = supabase
    .from("barbers")
    .select("*, users(name, phone)")
    .in("status", ["available", "busy"])
    .order("is_featured", { ascending: false })
    .order("rating", { ascending: false });

  if (accepts_women === "true") query = query.eq("accepts_women", true);

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });

  let barbers = data.map(b => ({
    ...b,
    distance_km: lat && lng && b.lat && b.lng
      ? haversine(+lat, +lng, b.lat, b.lng)
      : null,
  }));

  if (lat && lng) {
    barbers = barbers.filter(b => b.distance_km === null || b.distance_km <= +radius_km);
  }

  res.json(barbers);
});

// GET /barbers/me — authenticated barber fetches their own profile
router.get("/me", authenticate, requireBarber, async (req, res) => {
  const { data, error } = await supabase
    .from("barbers").select("*").eq("user_id", req.user.id).single();
  if (error || !data) return res.status(404).json({ error: "Barber profile not found" });
  res.json(data);
});

// GET /barbers/:id
router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("barbers").select("*, users(name, email, phone)")
    .eq("id", req.params.id).single();
  if (error || !data) return res.status(404).json({ error: "Barber not found" });
  res.json(data);
});

// PUT /barbers/location — barber updates GPS
router.put("/location", authenticate, requireBarber, async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });
  const { error } = await supabase.from("barbers")
    .update({ lat, lng, location_updated_at: new Date() }).eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// PUT /barbers/profile — update barber profile fields
router.put("/profile", authenticate, requireBarber, async (req, res) => {
  const allowed = ["accepts_women", "specialty", "bio"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0)
    return res.status(400).json({ error: "No valid fields to update" });
  const { error } = await supabase.from("barbers")
    .update(updates).eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// PUT /barbers/status — go online/offline
router.put("/status", authenticate, requireBarber, async (req, res) => {
  const { status } = req.body;
  if (!["available","busy","offline"].includes(status))
    return res.status(400).json({ error: "Invalid status" });
  const { error } = await supabase.from("barbers")
    .update({ status }).eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, status });
});

module.exports = router;
