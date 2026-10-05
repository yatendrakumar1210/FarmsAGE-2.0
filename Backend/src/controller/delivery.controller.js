const User = require("../models/user.model");
const Order = require("../models/order.model");
const mongoose = require("mongoose");
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

// ─── PUT /api/delivery/availability ───────────────────────────────────────
// Online / Offline toggle. Only approved delivery partners can manage availability.
// Going offline must NOT cancel or abandon an already accepted active delivery.
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isAvailable must be a boolean (true or false)",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.deliveryStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Only approved delivery partners can manage availability",
      });
    }

    // BUSINESS RULE: Going offline sets isAvailable = false to stop new incoming requests.
    // It does NOT cancel, drop, or abandon any active orders already accepted by this partner.
    user.isAvailable = isAvailable;
    await user.save();

    res.json({
      success: true,
      message: `Delivery partner is now ${user.isAvailable ? "Online" : "Offline"}`,
      isAvailable: user.isAvailable,
    });
  } catch (error) {
    console.error("Update availability error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/delivery/dashboard ──────────────────────────────────────────
// Authoritative dashboard statistics computed directly from the database.
exports.getDeliveryDashboard = async (req, res) => {
  try {
    const partnerId = req.user.id;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Today's completed deliveries
    const completedToday = await Order.countDocuments({
      deliveryPartnerId: partnerId,
      status: "Delivered",
      updatedAt: { $gte: startOfToday },
    });

    // 2. Active delivery count (accepted and in progress, not Delivered or Cancelled)
    const activeDeliveryCount = await Order.countDocuments({
      deliveryPartnerId: partnerId,
      status: { $nin: ["Delivered", "Cancelled"] },
    });

    // 3. Total all-time completed deliveries
    const totalCompleted = await Order.countDocuments({
      deliveryPartnerId: partnerId,
      status: "Delivered",
    });

    // 4. Available orders count (only if currently online)
    let availableOrdersCount = 0;
    if (req.deliveryUser?.isAvailable) {
      availableOrdersCount = await Order.countDocuments({
        deliveryPartnerId: null,
        vendorId: { $ne: null },
        status: "Processing",
        $or: [
          { paymentMethod: "COD" },
          { paymentMethod: "Online", paymentStatus: "Paid" },
        ],
      });
    }

    // 5. Active delivery preview (if any)
    const activeOrder = await Order.findOne({
      deliveryPartnerId: partnerId,
      status: { $nin: ["Delivered", "Cancelled"] },
    })
      .populate("vendorId", "name storeName storeAddress phone specialty")
      .populate("userId", "name phone email")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      stats: {
        todayDeliveries: completedToday,
        todayEarnings: 0, // Phase 2: Authoritative earnings will be implemented in future pricing phase (₹8/km)
        activeDeliveries: activeDeliveryCount,
        completedToday,
        totalCompleted,
        availableOrdersCount,
        isAvailable: Boolean(req.deliveryUser?.isAvailable),
        deliveryStatus: req.deliveryUser?.deliveryStatus || "approved",
        partnerName: req.deliveryUser?.name || "Delivery Partner",
      },
      activeOrder: activeOrder || null,
    });
  } catch (error) {
    console.error("Delivery dashboard error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/delivery/orders/available ────────────────────────────────────
// Available delivery requests feed. Restricted to online approved partners.
// Protects sensitive customer PII before order acceptance.
exports.getAvailableOrders = async (req, res) => {
  try {
    if (!req.deliveryUser?.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Delivery partner must be online to view available orders",
        isAvailable: false,
      });
    }

    // Query unassigned, eligible orders belonging to a single vendor
    const eligibleOrders = await Order.find({
      deliveryPartnerId: null,
      vendorId: { $ne: null },
      status: "Processing",
      $or: [
        { paymentMethod: "COD" },
        { paymentMethod: "Online", paymentStatus: "Paid" },
      ],
    })
      .populate("vendorId", "name storeName storeAddress phone specialty coordinates")
      .sort({ createdAt: -1 })
      .lean();

    // Sanitize to prevent exposing sensitive customer PII before acceptance (Section 4)
    const sanitizedOrders = eligibleOrders.map((order) => {
      const totalItems = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
      return {
        _id: order._id,
        vendor: {
          id: order.vendorId?._id,
          name: order.vendorId?.name || "Vendor",
          storeName: order.vendorId?.storeName || "Local Farm Store",
          storeAddress: order.vendorId?.storeAddress || "Store Pickup Address",
          specialty: order.vendorId?.specialty || "",
        },
        itemCount: (order.items || []).length,
        totalQuantity: totalItems,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        // Area / City destination preview (NO customer name, phone, or exact street/door address)
        destinationArea: {
          city: order.deliveryAddress?.city || "",
          pincode: order.deliveryAddress?.pincode || "",
          landmark: order.deliveryAddress?.landmark || "",
        },
        createdAt: order.createdAt,
      };
    });

    res.json({
      success: true,
      count: sanitizedOrders.length,
      orders: sanitizedOrders,
    });
  } catch (error) {
    console.error("Get available orders error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/delivery/orders/:orderId/accept ──────────────────────────────
// ATOMIC order acceptance via findOneAndUpdate. Race-condition proof.
// Exactly one partner wins; second simultaneous attempt receives 409 Conflict.
exports.acceptDeliveryOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    if (!req.deliveryUser?.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "You must be online to accept delivery orders",
      });
    }

    // ATOMIC database operation via findOneAndUpdate
    // Conditions strictly require:
    // 1. _id matches
    // 2. deliveryPartnerId is NULL (unassigned)
    // 3. vendorId is NOT NULL (single vendor rule)
    // 4. status is eligible (Placed, Accepted, Packing, Processing)
    // 5. payment is valid (COD or Paid Online)
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryPartnerId: null,
        vendorId: { $ne: null },
        status: "Processing",
        $or: [
          { paymentMethod: "COD" },
          { paymentMethod: "Online", paymentStatus: "Paid" },
        ],
      },
      {
        $set: {
          deliveryPartnerId: req.user.id,
        },
      },
      { returnDocument: "after" }
    )
      .populate("vendorId", "name storeName storeAddress phone specialty coordinates")
      .populate("userId", "name phone email");

    if (!updatedOrder) {
      // Investigate why acceptance failed to provide the exact status code
      const existing = await Order.findById(orderId);
      if (!existing) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      if (existing.deliveryPartnerId) {
        // Concurrency conflict: already claimed by another partner
        return res.status(409).json({
          success: false,
          code: "ORDER_ALREADY_ACCEPTED",
          message: "Order has already been accepted by another delivery partner",
        });
      }

      if (!existing.vendorId) {
        return res.status(400).json({
          success: false,
          message: "Order is not eligible for delivery (no vendor assigned)",
        });
      }

      if (existing.status !== "Processing") {
        return res.status(400).json({
          success: false,
          message: `Order status '${existing.status}' is not eligible for delivery acceptance`,
        });
      }

      if (existing.paymentMethod === "Online" && existing.paymentStatus !== "Paid") {
        return res.status(400).json({
          success: false,
          message: "Online order payment is not completed",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Order is not eligible for delivery acceptance",
      });
    }

    res.json({
      success: true,
      message: "Order successfully accepted",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Accept delivery order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/delivery/orders/active ──────────────────────────────────────
// Returns the authenticated partner's currently active/accepted delivery.
exports.getActiveDelivery = async (req, res) => {
  try {
    const activeOrder = await Order.findOne({
      deliveryPartnerId: req.user.id,
      status: { $nin: ["Delivered", "Cancelled"] },
    })
      .populate("vendorId", "name storeName storeAddress phone specialty coordinates")
      .populate("userId", "name phone email")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      hasActiveDelivery: Boolean(activeOrder),
      order: activeOrder || null,
    });
  } catch (error) {
    console.error("Get active delivery error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/delivery/orders/:orderId ────────────────────────────────────
// Delivery order details with strict privacy protection and IDOR prevention.
exports.getDeliveryOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId)
      .populate("vendorId", "name storeName storeAddress phone specialty coordinates")
      .populate("userId", "name phone email");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // IDOR Check 1: Partner owns this order -> Return full operational details
    if (order.deliveryPartnerId && String(order.deliveryPartnerId) === String(req.user.id)) {
      return res.json({
        success: true,
        order,
        isAssignedToMe: true,
      });
    }

    // IDOR Check 2: Order is assigned to ANOTHER partner -> Strictly forbidden (403)
    if (order.deliveryPartnerId && String(order.deliveryPartnerId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Delivery is assigned to another partner",
      });
    }

    // IDOR Check 3: Order is unassigned -> Safe preview if partner is online
    if (!order.deliveryPartnerId) {
      if (!req.deliveryUser?.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "You must be online to view available order details",
        });
      }

      const totalItems = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
      const safePreview = {
        _id: order._id,
        vendor: {
          id: order.vendorId?._id,
          name: order.vendorId?.name || "Vendor",
          storeName: order.vendorId?.storeName || "Local Farm Store",
          storeAddress: order.vendorId?.storeAddress || "Store Pickup Address",
          phone: order.vendorId?.phone || "",
          specialty: order.vendorId?.specialty || "",
        },
        items: (order.items || []).map((i) => ({
          name: i.name,
          quantity: i.quantity,
          weight: i.weight,
        })),
        itemCount: (order.items || []).length,
        totalQuantity: totalItems,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        destinationArea: {
          city: order.deliveryAddress?.city || "",
          pincode: order.deliveryAddress?.pincode || "",
          landmark: order.deliveryAddress?.landmark || "",
        },
        createdAt: order.createdAt,
      };

      return res.json({
        success: true,
        order: safePreview,
        isAssignedToMe: false,
      });
    }

    return res.status(400).json({ success: false, message: "Order is not accessible" });
  } catch (error) {
    console.error("Get order detail error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/delivery/orders/history ─────────────────────────────────────
// Completed deliveries history for the authenticated partner.
exports.getDeliveryHistory = async (req, res) => {
  try {
    const orders = await Order.find({
      deliveryPartnerId: req.user.id,
      status: "Delivered",
    })
      .populate("vendorId", "name storeName storeAddress")
      .sort({ updatedAt: -1 })
      .limit(100);

    const historyItems = orders.map((order) => ({
      _id: order._id,
      date: order.updatedAt || order.createdAt,
      vendorName: order.vendorId?.storeName || order.vendorId?.name || "Vendor",
      deliveryCity: order.deliveryAddress?.city || "",
      deliveryPincode: order.deliveryAddress?.pincode || "",
      itemCount: (order.items || []).length,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      status: order.status,
      earnings: 0, // Phase 2: distance pricing will be calculated in future pricing phase
    }));

    res.json({
      success: true,
      count: historyItems.length,
      orders: historyItems,
    });
  } catch (error) {
    console.error("Get delivery history error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
