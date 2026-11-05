const jwt = require("jsonwebtoken");
const config = require("../config/env");

function verifyToken(req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Access denied. No authentication token provided." });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied. Invalid token format." });
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      const isExpired = err.name === "TokenExpiredError";
      return res.status(401).json({
        success: false,
        code: isExpired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
        message: isExpired ? "Access token has expired." : "Invalid access token.",
      });
    }

    req.user = decoded;
    req.token = token;
    next();
  });
}

module.exports = verifyToken;
