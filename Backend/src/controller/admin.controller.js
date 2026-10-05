const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const Announcement = require("../models/announcement.model");
const Coupon = require("../models/coupon.model");
const { sendEmail } = require("../utils/sendEmail");
const orderStatusTemplate = require("../templates/orderStatusTemplate");
const shopStatusTemplate = require("../templates/shopStatusTemplate");
const { restoreOrderInventoryAtomic, initiateOrderRefund } = require("./order.controller");

// 📦 Get all orders (with populated user info)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email phone")
      .populate("vendorId", "name storeName")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
};

// 🔄 Update order status
exports.updateOrder = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Terminal state protection: Cancelled and Delivered are terminal
    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled and cannot be changed" });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({ message: "Delivered orders cannot be changed" });
    }

    order.status = status;
    if (status === "Delivered" && order.paymentMethod === "COD") {
      order.paymentStatus = "Paid";
    }

    await order.save();

    if (status === "Cancelled") {
      await restoreOrderInventoryAtomic(order._id);
      if (order.paymentMethod === "Online" && order.paymentStatus === "Paid") {
        await initiateOrderRefund(order, "Admin cancelled order");
      }
    }

    const updatedOrder = await Order.findById(order._id);

    // 📩 Notify User of Order Update
    const customer = await User.findById(order.userId);
    if (customer && customer.email) {
      sendEmail({
        to: customer.email,
        subject: `Order Update: #${order._id.toString().slice(-6)}`,
        html: orderStatusTemplate(customer.name, order._id.toString().slice(-6), status)
      }).catch(e => console.error("Admin order email error:", e));
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: "Failed to update order", error: err.message });
  }
};

// 📋 Get all products (admin view)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("vendorId", "name storeName")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
};

// 🌐 Get all products (public — no auth required, server-side paginated & filtered)
exports.getPublicProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 12);
    const skip = (page - 1) * limit;

    const { category, search, sortBy } = req.query;

    // 🌍 Only show Global (Admin) products in the main catalog
    const query = {
      $or: [{ vendorId: null }, { vendorId: { $exists: false } }]
    };

    // Category filtering
    if (category && category !== "All") {
      if (category.toLowerCase() === "organic") {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [{ category: "Organic" }, { isOrganic: true }]
        });
      } else if (category.toLowerCase().includes("herb")) {
        query.category = { $regex: /herb/i };
      } else {
        query.category = { $regex: new RegExp(`^${category}$`, "i") };
      }
    }

    // Search filtering
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i");
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: searchRegex },
          { category: searchRegex }
        ]
      });
    }

    // Sorting (In-stock quantity > 0 first, Out-of-stock quantity: 0 last)
    let sortOptions = { quantity: -1, createdAt: -1 };
    if (sortBy === "Price: Low to High" || sortBy === "price_asc") {
      sortOptions = { quantity: -1, price: 1 };
    } else if (sortBy === "Price: High to Low" || sortBy === "price_desc") {
      sortOptions = { quantity: -1, price: -1 };
    } else if (sortBy === "Newest First" || sortBy === "newest") {
      sortOptions = { quantity: -1, createdAt: -1 };
    }

    // ✅ Parallelize count + find — saves one MongoDB round-trip
    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .select("_id name image category price oldPrice discount unit quantity isOrganic createdAt")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const totalPages = Math.ceil(totalProducts / limit) || 1;

    // ✅ HTTP Cache headers for public product data (non-personalized)
    // 60s browser cache, 2min CDN cache, stale-while-revalidate for fast UX
    if (!search) {
      res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=60');
    } else {
      res.set('Cache-Control', 'no-store');
    }

    res.json({
      products,
      totalProducts,
      currentPage: page,
      totalPages
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
};

const mongoose = require("mongoose");
const { validateProductInput } = require("../utils/productValidation");

// 🛒 Add product
exports.addProduct = async (req, res) => {
  try {
    const { isValid, errors, sanitized } = validateProductInput(req.body, false);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    if (req.body.vendorId && mongoose.Types.ObjectId.isValid(req.body.vendorId)) {
      sanitized.vendorId = req.body.vendorId;
    } else {
      sanitized.vendorId = null;
    }

    const product = await Product.create(sanitized);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to add product", error: err.message });
  }
};

// ✏️ Update product (price, quantity, name, etc.)
exports.updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID format" });
    }

    const { isValid, errors, sanitized } = validateProductInput(req.body, true);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    if (req.body.vendorId !== undefined) {
      sanitized.vendorId = req.body.vendorId || null;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, sanitized, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to update product", error: err.message });
  }
};

// ❌ Delete product
exports.deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID format" });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
};

// 👤 Get users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// 👤 Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (role === "delivery") {
      return res.status(400).json({
        message: "Cannot convert existing user to delivery partner. Delivery partners must register through the dedicated delivery registration flow.",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "delivery" && role !== "delivery") {
      return res.status(400).json({ message: "Cannot convert delivery partner to other role." });
    }

    user.role = role;
    await user.save();

    const sanitized = user.toObject();
    delete sanitized.password;
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ message: "Failed to update user role", error: err.message });
  }
};

// 🏠 Update vendor shop status (Approve/Reject)
exports.updateShopStatus = async (req, res) => {
  try {
    const { shopStatus } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { shopStatus },
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    // 📩 Notify Vendor of Shop Status Update
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: `Store Registration: ${shopStatus.toUpperCase()}`,
        html: shopStatusTemplate(user.name, shopStatus)
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update shop status", error: err.message });
  }
};

// 📢 Announcement Broadcast Handlers
exports.getBroadcast = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ isActive: true }).sort({ updatedAt: -1 });
    res.json({ message: announcement ? announcement.message : "" });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch announcement", error: err.message });
  }
};

exports.setBroadcast = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Announcement message is required" });
    }
    // Deactivate previous active announcements
    await Announcement.updateMany({}, { isActive: false });
    const announcement = await Announcement.create({
      message: message.trim(),
      isActive: true,
      updatedBy: req.user ? req.user._id : null,
    });
    res.json({ message: announcement.message, success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to set announcement", error: err.message });
  }
};

exports.clearBroadcast = async (req, res) => {
  try {
    await Announcement.updateMany({}, { isActive: false });
    res.json({ message: "", success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear announcement", error: err.message });
  }
};

// 🎟️ Coupon Management Handlers
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch coupons", error: err.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      expiryDate,
      isActive,
      usageLimit,
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Coupon code is required" });
    }
    if (discountValue === undefined || discountValue === null || Number(discountValue) < 0) {
      return res.status(400).json({ message: "Valid discount value is required" });
    }

    const normalizedCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(400).json({ message: `Coupon '${normalizedCode}' already exists` });
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      discountType: discountType === "fixed" ? "fixed" : "percentage",
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isActive: isActive !== false,
      usageLimit: usageLimit ? Number(usageLimit) : null,
    });

    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: "Failed to create coupon", error: err.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json({ message: "Coupon deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete coupon", error: err.message });
  }
};

// 🚚 Get all delivery partners (Admin only)
exports.getDeliveryPartners = async (req, res) => {
  try {
    const { status, isAvailable } = req.query;
    const query = { role: "delivery" };

    if (status && ["pending", "approved", "rejected", "suspended"].includes(status)) {
      query.deliveryStatus = status;
    }

    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === "true";
    }

    const partners = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch delivery partners", error: err.message });
  }
};

// 🚚 Update delivery partner status (Approve/Reject/Suspend) (Admin only)
exports.updateDeliveryPartnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid delivery partner ID format" });
    }

    const validStatuses = ["pending", "approved", "rejected", "suspended"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const partner = await User.findById(id);
    if (!partner) {
      return res.status(404).json({ success: false, message: "Delivery partner not found" });
    }

    // Crucial check: Target user must be a delivery partner
    if (partner.role !== "delivery") {
      return res.status(400).json({
        success: false,
        message: "Target user is not a delivery partner. Cannot update delivery status of customer or vendor.",
      });
    }

    partner.deliveryStatus = status;

    // Suspending forces isAvailable = false
    // Reactivating/approving keeps isAvailable = false (partner must manually go online later)
    partner.isAvailable = false;

    await partner.save();

    const sanitized = partner.toObject();
    delete sanitized.password;

    res.json({
      success: true,
      message: `Delivery partner status updated to ${status}`,
      partner: sanitized,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update delivery partner status", error: err.message });
  }
};
