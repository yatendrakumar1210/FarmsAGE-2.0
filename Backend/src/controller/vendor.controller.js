const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/sendEmail");
const orderStatusTemplate = require("../templates/orderStatusTemplate");
const { restoreOrderInventoryAtomic } = require("./order.controller");

// ─── Vendor Product Management ───

// 📋 Get vendor's own products
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendor products", error: err.message });
  }
};

// 📋 Get all global products (admin-created, no vendorId) for vendor to browse and add
exports.getGlobalProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendorId: null }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch global products", error: err.message });
  }
};

const mongoose = require("mongoose");
const { validateProductInput } = require("../utils/productValidation");

// ➕ Add product to vendor's store (clone from global or create new)
exports.addProduct = async (req, res) => {
  try {
    const { isValid, errors, sanitized } = validateProductInput(req.body, false);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    sanitized.vendorId = req.user.id;
    const product = await Product.create(sanitized);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to add product", error: err.message });
  }
};

// ✏️ Update vendor's product
exports.updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID format" });
    }

    const { isValid, errors, sanitized } = validateProductInput(req.body, true);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    delete sanitized.vendorId; // Never allow vendor to change ownership

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendorId: req.user.id },
      sanitized,
      { returnDocument: "after", runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found or access denied" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to update product", error: err.message });
  }
};

// ❌ Delete vendor's product
exports.deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID format" });
    }

    const product = await Product.findOneAndDelete({ _id: req.params.id, vendorId: req.user.id });
    if (!product) return res.status(404).json({ message: "Product not found or access denied" });
    res.json({ msg: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
};

// ─── Vendor Orders ───

// 📦 Get orders assigned to this vendor
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ vendorId: req.user.id })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendor orders", error: err.message });
  }
};

// 🔄 Update order status (vendor can change status of their orders)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found or access denied" });

    if (order.status === "Cancelled" && status === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    if (order.status === "Delivered" && status === "Cancelled") {
      return res.status(400).json({ message: "Delivered orders cannot be cancelled" });
    }

    order.status = status;
    if (status === "Delivered" && order.paymentMethod === "COD") {
      order.paymentStatus = "Paid";
    }
    
    await order.save();

    if (status === "Cancelled") {
      await restoreOrderInventoryAtomic(order._id);
    }

    const updatedOrder = await Order.findById(order._id);

    // 📩 Notify User of Status Update
    const customer = await User.findById(order.userId);
    if (customer && customer.email) {
      sendEmail({
        to: customer.email,
        subject: `Order Update: #${order._id.toString().slice(-6)}`,
        html: orderStatusTemplate(customer.name, order._id.toString().slice(-6), status)
      }).catch(e => console.error("Vendor order update email error:", e));
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: "Failed to update order", error: err.message });
  }
};

// ─── Vendor Profile ───

// 👤 Get vendor profile (Accessible to any vendor to view their store profile & status)
exports.getProfile = async (req, res) => {
  try {
    if (req.user.role !== "vendor" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied. Vendor role required." });
    }

    const vendor = await User.findById(req.user.id).select("-password");
    if (!vendor) return res.status(404).json({ message: "User not found" });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
};

// ✏️ Update vendor profile (storeName, specialty, coordinates, storeImage, storeAddress)
exports.updateProfile = async (req, res) => {
  try {
    if (req.user.role !== "vendor" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied. Vendor role required." });
    }

    const { storeName, specialty, storeImage, coordinates, storeAddress } = req.body;
    const isProfileComplete = Boolean(storeName && (storeAddress || specialty));
    const vendor = await User.findByIdAndUpdate(
      req.user.id,
      { storeName, specialty, storeImage, coordinates, storeAddress, isProfileComplete },
      { returnDocument: "after" }
    ).select("-password");
    if (!vendor) return res.status(404).json({ message: "User not found" });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
};

// 🏠 Register vendor's shop
exports.registerShop = async (req, res) => {
  try {
    const { storeName, specialty, storeImage, coordinates, storeAddress, phone, email } = req.body;

    // 🔍 Check if email or phone is already taken by another user
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: req.user.id } });
      if (existingPhone) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
    }

    const vendor = await User.findByIdAndUpdate(
      req.user.id,
      { 
        storeName, 
        specialty, 
        storeImage, 
        coordinates,
        storeAddress,
        phone,
        email,
        role: "vendor",
        shopStatus: "pending"
      },
      { new: true }
    ).select("-password");

    if (!vendor) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔑 Generate NEW token with updated role
    const token = jwt.sign(
      { id: vendor._id, role: vendor.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ user: vendor, token });
  } catch (err) {
    console.error("REGISTER SHOP ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to register shop" });
  }
};

// ─── Public: Nearby Vendors ───

// 🌍 Get nearby vendors (public endpoint, requires lat/lng query params)
exports.getNearbyVendors = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng query params are required" });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Find all vendors who have set coordinates and are approved
    const vendors = await User.find({
      role: "vendor",
      shopStatus: "approved",
      "coordinates.lat": { $ne: null },
      "coordinates.lng": { $ne: null },
    }).select("name storeName specialty storeImage coordinates");

    // Calculate distance using Haversine formula
    const toRadian = (degree) => (degree * Math.PI) / 180;

    const vendorsWithDistance = vendors
      .map((v) => {
        const vLat = v.coordinates.lat;
        const vLng = v.coordinates.lng;
        const R = 6371;
        const dLat = toRadian(vLat - userLat);
        const dLon = toRadian(vLng - userLng);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRadian(userLat)) * Math.cos(toRadian(vLat)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return {
          _id: v._id,
          name: v.storeName || v.name,
          specialty: v.specialty || "Fresh Farm Products",
          image: v.storeImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
          latitude: vLat,
          longitude: vLng,
          distance: parseFloat(distance.toFixed(2)),
        };
      })
      .filter((v) => v.distance <= 10)
      .sort((a, b) => a.distance - b.distance);

    res.json(vendorsWithDistance);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch nearby vendors", error: err.message });
  }
};

// 🏪 Get a specific vendor's public products
exports.getVendorProducts = async (req, res) => {
  try {
    const { vendorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ success: false, message: "Invalid vendor ID format" });
    }

    const vendor = await User.findById(vendorId).select("role shopStatus");
    if (!vendor || vendor.role !== "vendor" || vendor.shopStatus !== "approved") {
      return res.status(404).json({ success: false, message: "Vendor not found or not approved" });
    }

    const products = await Product.find({ vendorId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendor products", error: err.message });
  }
};

// 🏪 Get a specific vendor's public info
exports.getVendorInfo = async (req, res) => {
  try {
    const { vendorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ success: false, message: "Invalid vendor ID format" });
    }

    const vendor = await User.findById(vendorId).select("name storeName specialty storeImage coordinates role shopStatus");
    if (!vendor || vendor.role !== "vendor" || vendor.shopStatus !== "approved") {
      return res.status(404).json({ success: false, message: "Vendor not found or not approved" });
    }

    res.json({
      _id: vendor._id,
      name: vendor.name,
      storeName: vendor.storeName,
      specialty: vendor.specialty,
      storeImage: vendor.storeImage,
      coordinates: vendor.coordinates,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendor info", error: err.message });
  }
};
