const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireBarber(req, res, next) {
  if (req.user?.role !== "barber") return res.status(403).json({ error: "Barbers only" });
  next();
}

module.exports = { authenticate, requireBarber };
