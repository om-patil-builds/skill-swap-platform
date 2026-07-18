const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  let token;

  // 🔹 1. Get token from cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 🔹 2. Get token from Authorization header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // ❌ No token found
  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 IMPORTANT FIX
    req.user = {
      id: decoded.id || decoded._id, // support both cases
    };

    if (!req.user.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = authMiddleware;