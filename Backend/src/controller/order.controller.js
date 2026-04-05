const razorpay = require("../config/razorpay");
const Order = require("../models/order.model");
const crypto = require("crypto");

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    let totalAmount = 0;
    items.forEach((i) => (totalAmount += i.price * i.quantity));

    const order = await razorpay.orders.create({
      amount: totalAmount *100 ,
      currency: "INR",
    });

    res.json({ order, totalAmount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      deliveryAddress,
      totalAmount,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false });
    }

    const order = await Order.create({
      userId: req.user.id,
      items,
      deliveryAddress,
      totalAmount,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      paymentId: razorpay_payment_id,
      status: "Pending",
    });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// COD Order
exports.codOrder = async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;

    let totalAmount = 0;
    items.forEach((i) => (totalAmount += i.price * i.quantity));

    const order = await Order.create({
      userId: req.user.id,
      items,
      deliveryAddress,
      totalAmount,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      status: "Pending",
    });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get My Orders
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).populate(
    "items.productId",
  );

  res.json(orders);
};
