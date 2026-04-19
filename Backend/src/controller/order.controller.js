const razorpay = require("../config/razorpay");
const Order = require("../models/order.model");
const crypto = require("crypto");
const userTemplate = require("../templates/userTemplate");
const vendorTemplate = require("../templates/vendorTemplate");
const { sendEmail } = require("../utils/sendEmail");
const User = require("../models/user.model");

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
    console.error("RAZORPAY ORDER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Verify Payment (Handles Multi-Vendor Splitting)
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      deliveryAddress,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid Signature" });
    }

    // 🥡 Group items by vendorId
    const vendorGroups = items.reduce((acc, item) => {
      const vId = item.vendorId || "global";
      if (!acc[vId]) acc[vId] = [];
      acc[vId].push(item);
      return acc;
    }, {});

    const createdOrders = [];

    // 🚀 Create sub-orders for each vendor
    for (const [vId, vItems] of Object.entries(vendorGroups)) {
      const vTotal = vItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

      const order = await Order.create({
        userId: req.user.id,
        vendorId: vId === "global" ? null : vId,
        items: vItems,
        deliveryAddress,
        totalAmount: vTotal,
        paymentMethod: "Online",
        paymentStatus: "Paid",
        paymentId: razorpay_payment_id,
        status: "Pending",
      });
      createdOrders.push(order);
      
      // 📩 Send Vendor Email (if vendor exists)
      if (vId !== "global") {
        const vendor = await User.findById(vId);
        if (vendor && vendor.email) {
          await sendEmail({
            to: vendor.email,
            subject: "New Order Received",
            html: vendorTemplate(vendor.name, order.items),
          });
        }
      }
    }

    // 📩 User Email (outside loop to send only one)
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Order Confirmed",
        html: userTemplate(user.name, createdOrders),
      });
    }

    res.json({ success: true, order: createdOrders[0], allOrders: createdOrders });
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// COD Order (Handles Multi-Vendor Splitting)
exports.codOrder = async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🥡 Group items by vendorId
    const vendorGroups = items.reduce((acc, item) => {
      const vId = item.vendorId || "global";
      if (!acc[vId]) acc[vId] = [];
      acc[vId].push(item);
      return acc;
    }, {});

    const createdOrders = [];

    // 🚀 Create sub-orders for each vendor
    for (const [vId, vItems] of Object.entries(vendorGroups)) {
      const vTotal = vItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

      const order = await Order.create({
        userId: req.user.id,
        vendorId: vId === "global" ? null : vId,
        items: vItems,
        deliveryAddress,
        totalAmount: vTotal,
        paymentMethod: "COD",
        paymentStatus: "Pending",
        status: "Pending",
      });
      createdOrders.push(order);

      // 📩 Send Vendor Email (if vendor exists)
      if (vId !== "global") {
        const vendor = await User.findById(vId);
        if (vendor && vendor.email) {
          await sendEmail({
            to: vendor.email,
            subject: "New Order Received",
            html: vendorTemplate(vendor.name, order.items),
          });
        }
      }
    }

    // 📩 User Email (outside loop to send only one)
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Order Confirmed",
        html: userTemplate(user.name, createdOrders),
      });
    }

    res.json({ success: true, order: createdOrders[0], allOrders: createdOrders });
  } catch (err) {
    console.error("COD ORDER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get My Orders
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).populate("vendorId", "name storeName");

  res.json(orders);
};
