const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const VALID_VEHICLE_TYPES = ["Bike", "Scooter", "Electric Vehicle", "Bicycle"];

// ─── POST /api/delivery/register ──────────────────────────────────────────
// Dedicated delivery partner registration. Server forces role="delivery", deliveryStatus="pending", isAvailable=false.
exports.registerDeliveryPartner = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      vehicleType,
      vehicleNumber,
      drivingLicenceNumber,
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Full name is required" });
    }

    if (!phone || typeof phone !== "string" || phone.trim().length !== 10) {
      return res.status(400).json({ success: false, message: "Valid 10-digit phone number is required" });
    }

    if (!password || typeof password !== "string" || password.length < 4) {
      return res.status(400).json({ success: false, message: "Password must be at least 4 characters long" });
    }

    const cleanPhone = phone.trim();

    // Check if phone is already registered
    const existingPhone = await User.findOne({ phone: cleanPhone });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: "User with this phone number already exists" });
    }

    let cleanEmail = null;
    if (email && typeof email === "string" && email.trim()) {
      cleanEmail = email.trim().toLowerCase();
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "User with this email already exists" });
      }
    }

    // Validate vehicle type if provided
    let vType = "Bike";
    if (vehicleType && VALID_VEHICLE_TYPES.includes(vehicleType)) {
      vType = vehicleType;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // SERVER FORCES ROLE AND INITIAL STATUS (Never trust client body)
    const newDeliveryPartnerData = {
      name: name.trim(),
      phone: cleanPhone,
      password: hashedPassword,
      role: "delivery",
      deliveryStatus: "pending",
      isAvailable: false,
      shopStatus: "none",
      authProvider: "password",
      isProfileComplete: true,
      isVerified: true,
      vehicleDetails: {
        vehicleType: vType,
        vehicleNumber: vehicleNumber ? String(vehicleNumber).trim().toUpperCase() : "",
      },
      drivingLicenceNumber: drivingLicenceNumber
        ? String(drivingLicenceNumber).trim().toUpperCase()
        : "",
    };

    if (cleanEmail) {
      newDeliveryPartnerData.email = cleanEmail;
    }

    const user = await User.create(newDeliveryPartnerData);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Delivery partner registered successfully. Application pending admin approval.",
      token,
      user,
    });
  } catch (error) {
    console.error("Delivery registration error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/delivery/profile ────────────────────────────────────────────
// Identifies authenticated delivery partner from req.user.id
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get delivery profile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/delivery/profile ────────────────────────────────────────────
// Allows pending or rejected delivery partners to update vehicle/licence info.
// Suspended accounts are blocked. Client cannot change role or arbitrary deliveryStatus.
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Suspended partners must remain operationally blocked and cannot modify profile
    if (user.deliveryStatus === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Suspended delivery partner accounts cannot modify profile. Please contact support.",
      });
    }

    const {
      name,
      vehicleType,
      vehicleNumber,
      drivingLicenceNumber,
    } = req.body;

    if (name && typeof name === "string" && name.trim()) {
      user.name = name.trim();
    }

    if (vehicleType && VALID_VEHICLE_TYPES.includes(vehicleType)) {
      user.vehicleDetails.vehicleType = vehicleType;
    }

    if (vehicleNumber !== undefined) {
      user.vehicleDetails.vehicleNumber = String(vehicleNumber).trim().toUpperCase();
    }

    if (drivingLicenceNumber !== undefined) {
      user.drivingLicenceNumber = String(drivingLicenceNumber).trim().toUpperCase();
    }

    // If a rejected partner edits their profile, set status to pending for admin reconsideration
    if (user.deliveryStatus === "rejected") {
      user.deliveryStatus = "pending";
    }

    // Client cannot escalate role or set approved status directly
    user.role = "delivery";

    await user.save();

    const sanitized = user.toObject();
    delete sanitized.password;

    res.json({
      success: true,
      message: "Delivery partner profile updated successfully",
      user: sanitized,
    });
  } catch (error) {
    console.error("Update delivery profile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/delivery/operational-check ──────────────────────────────────
// Test/Verification endpoint to confirm approved delivery partner operational access
exports.operationalCheck = async (req, res) => {
  res.json({
    success: true,
    message: "Operational delivery access authorized",
    partnerId: req.user.id,
    deliveryStatus: req.deliveryUser.deliveryStatus,
  });
};
