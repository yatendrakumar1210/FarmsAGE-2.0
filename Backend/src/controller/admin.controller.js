const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const { sendEmail } = require("../utils/sendEmail");
const orderStatusTemplate = require("../templates/orderStatusTemplate");
const shopStatusTemplate = require("../templates/shopStatusTemplate");

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
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after" },
    );

    // 📩 Notify User of Order Update
    const customer = await User.findById(order.userId);
    if (customer && customer.email) {
      await sendEmail({
        to: customer.email,
        subject: `Order Update: #${order._id.toString().slice(-6)}`,
        html: orderStatusTemplate(customer.name, order._id.toString().slice(-6), status)
      });
    }

    res.json(order);
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

// 🌐 Get all products (public — no auth required)
exports.getPublicProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    
    // Fetch products and populate vendor info to check status
    const products = await Product.find(filter)
      .populate("vendorId", "shopStatus")
      .sort({ createdAt: -1 });

    // 🌍 Only show Global (Admin) products in the main catalog
    // Vendor products will only be seen in their respective Store Pages
    const filteredProducts = products.filter(p => !p.vendorId);

    res.json(filteredProducts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
};

// 🛒 Add product
exports.addProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to add product", error: err.message });
  }
};

// ✏️ Update product (price, quantity, name, etc.)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
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
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { returnDocument: "after", runValidators: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
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
