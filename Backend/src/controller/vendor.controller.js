const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");

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

// ➕ Add product to vendor's store (clone from global or create new)
exports.addProduct = async (req, res) => {
  try {
    const productData = { ...req.body, vendorId: req.user.id };
    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to add product", error: err.message });
  }
};

// ✏️ Update vendor's product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendorId: req.user.id },
      req.body,
      { new: true, runValidators: true }
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

    order.status = status;
    if (status === "Delivered" && order.paymentMethod === "COD") {
      order.paymentStatus = "Paid";
    }
    
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to update order", error: err.message });
  }
};

// ─── Vendor Profile ───

// 👤 Get vendor profile
exports.getProfile = async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id).select("-password");
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
};

// ✏️ Update vendor profile (storeName, specialty, coordinates, storeImage)
exports.updateProfile = async (req, res) => {
  try {
    const { storeName, specialty, storeImage, coordinates } = req.body;
    const vendor = await User.findByIdAndUpdate(
      req.user.id,
      { storeName, specialty, storeImage, coordinates },
      { new: true }
    ).select("-password");
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
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

    // Find all vendors who have set coordinates
    const vendors = await User.find({
      role: "vendor",
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
    const products = await Product.find({ vendorId: req.params.vendorId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendor products", error: err.message });
  }
};

// 🏪 Get a specific vendor's public info
exports.getVendorInfo = async (req, res) => {
  try {
    const vendor = await User.findById(req.params.vendorId).select("name storeName specialty storeImage coordinates");
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendor info", error: err.message });
  }
};
