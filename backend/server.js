require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL, "http://localhost:3000", "http://localhost:19006"],
  credentials: true,
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Webhooks need raw body BEFORE express.json()
app.use("/webhooks", require("./routes/webhooks"));
app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use("/auth",          require("./routes/auth"));
app.use("/barbers",       require("./routes/barbers"));
app.use("/bookings",      require("./routes/bookings"));
app.use("/payments",      require("./routes/payments"));
app.use("/subscriptions", require("./routes/subscriptions"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SnapCut API on port ${PORT}`));
