const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");

// 📦 Get all orders
exports.getOrders = async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
};

// 🔄 Update order status
exports.updateOrder = async (req, res) => {
  const { status } = req.body;

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true },
  );

  res.json(order);
};

// 🛒 Add product
exports.addProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
};

// ✏️ Update product
exports.updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.json(product);
};

// ❌ Delete product
exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
};

// 👤 Get users
exports.getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};
