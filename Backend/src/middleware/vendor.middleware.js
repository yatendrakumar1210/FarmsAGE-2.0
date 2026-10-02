const User = require("../models/user.model");

const vendorOnly = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Admins bypass vendor restriction
    if (req.user.role === "admin") {
      return next();
    }

    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Access Denied. Vendor role required." });
    }

    // Verify against database for real-time status & approved check
    const user = await User.findById(req.user.id).select("role shopStatus");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "vendor" && user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied. Vendor role required." });
    }

    if (user.shopStatus !== "approved") {
      return res.status(403).json({
        message: "Vendor access denied. Your shop application is pending admin approval.",
        shopStatus: user.shopStatus || "pending",
      });
    }

    next();
  } catch (error) {
    console.error("Vendor authorization error:", error);
    return res.status(500).json({ message: "Internal authorization error" });
  }
};

module.exports = vendorOnly;
