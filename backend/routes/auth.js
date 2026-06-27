const router   = require("express").Router();
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const supabase = require("../lib/supabase");
const { authenticate } = require("../middleware/auth");

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

router.post("/register",
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
  body("name").notEmpty(),
  body("role").isIn(["customer", "barber"]),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name, role, specialty, phone, gender, provider_type } = req.body;

    const { data: existing } = await supabase
      .from("users").select("id").eq("email", email).single();
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const password_hash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase
      .from("users").insert({ email, password_hash, name, role, phone }).select().single();
    if (error) return res.status(500).json({ error: error.message });

    if (role === "barber") {
      const isFemale = gender === "female";
      const isHairdresser = provider_type === "hairdresser";
      await supabase.from("barbers").insert({
        user_id: user.id, specialty: specialty || "General",
        status: "offline", base_price: 35,
        provider_type: provider_type || "barber",
        is_female: isFemale,
        accepts_women: isFemale || isHairdresser,
      });
    }

    res.status(201).json({ token: makeToken(user), user: { id: user.id, name, email, role } });
  }
);

router.post("/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const { data: user } = await supabase.from("users").select("*").eq("email", email).single();
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    res.json({ token: makeToken(user), user: { id: user.id, name: user.name, email, role: user.role } });
  }
);

router.get("/me", authenticate, async (req, res) => {
  const { data: user } = await supabase
    .from("users").select("id, name, email, role, phone").eq("id", req.user.id).single();
  res.json(user);
});

module.exports = router;
