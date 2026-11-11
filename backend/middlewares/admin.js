const User = require("../models/User");

async function checkAdmin(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, message: "Access denied. Authentication required." });
  }

  try {
    // Re-verify the role strictly from the database to ensure it wasn't forged or revoked
    const user = await User.findById(req.user.id).select("role isActive");
    if (!user || !user.isActive) {
      return res.status(403).json({ success: false, message: "Account is inactive or no longer exists." });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Administrator privileges required." });
    }

    // Attach verified user instance
    req.adminUser = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error verifying administrator authorization." });
  }
}

module.exports = checkAdmin;
