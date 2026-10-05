const User = require("../models/user.model");

/**
 * deliveryAccountOnly
 * Allows any authenticated user whose role in the database is "delivery".
 * Allows pending or rejected delivery partners to view and update their profile.
 * Strictly blocks customers ("user"), vendors ("vendor"), and admins ("admin").
 */
const deliveryAccountOnly = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (req.user.role !== "delivery") {
      return res.status(403).json({ success: false, message: "Access Denied. Delivery partner role required." });
    }

    const user = await User.findById(req.user.id).select("role deliveryStatus isAvailable name email phone vehicleDetails");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "delivery") {
      return res.status(403).json({ success: false, message: "Access Denied. Delivery partner role required." });
    }

    // If suspended, ensure isAvailable is forced to false
    if (user.deliveryStatus === "suspended" && user.isAvailable) {
      user.isAvailable = false;
      await user.save();
    }

    req.deliveryUser = user;
    next();
  } catch (error) {
    console.error("Delivery account authorization error:", error);
    return res.status(500).json({ success: false, message: "Internal authorization error" });
  }
};

/**
 * approvedDeliveryOnly
 * Restricted strictly to approved delivery partners.
 * Rejects customers, vendors, admins, as well as pending, rejected, and suspended partners with HTTP 403.
 * Forces isAvailable = false if account is suspended.
 */
const approvedDeliveryOnly = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (req.user.role !== "delivery") {
      return res.status(403).json({ success: false, message: "Access Denied. Delivery partner role required." });
    }

    const user = await User.findById(req.user.id).select("role deliveryStatus isAvailable name email phone vehicleDetails");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "delivery") {
      return res.status(403).json({ success: false, message: "Access Denied. Delivery partner role required." });
    }

    if (user.deliveryStatus === "suspended") {
      if (user.isAvailable) {
        user.isAvailable = false;
        await user.save();
      }
      return res.status(403).json({
        success: false,
        message: "Access Denied. Delivery partner account is suspended.",
        deliveryStatus: "suspended",
      });
    }

    if (user.deliveryStatus === "pending") {
      return res.status(403).json({
        success: false,
        message: "Access Denied. Delivery partner application is pending admin approval.",
        deliveryStatus: "pending",
      });
    }

    if (user.deliveryStatus === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Access Denied. Delivery partner application has been rejected.",
        deliveryStatus: "rejected",
      });
    }

    if (user.deliveryStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Access Denied. Delivery partner account is not approved.",
        deliveryStatus: user.deliveryStatus || "none",
      });
    }

    req.deliveryUser = user;
    next();
  } catch (error) {
    console.error("Approved delivery authorization error:", error);
    return res.status(500).json({ success: false, message: "Internal authorization error" });
  }
};

/**
 * onlineApprovedDeliveryOnly
 * Requires an approved delivery partner who is actively ONLINE (isAvailable === true).
 * Rejects offline partners with HTTP 400 Bad Request.
 */
const onlineApprovedDeliveryOnly = (req, res, next) => {
  if (!req.deliveryUser || !req.deliveryUser.isAvailable) {
    return res.status(400).json({
      success: false,
      message: "You are currently offline. Please go online to perform this action.",
      isAvailable: false,
    });
  }
  next();
};

module.exports = {
  deliveryAccountOnly,
  approvedDeliveryOnly,
  onlineApprovedDeliveryOnly,
};
