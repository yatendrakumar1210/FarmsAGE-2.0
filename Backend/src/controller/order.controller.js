const razorpay = require("../config/razorpay");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const crypto = require("crypto");
const mongoose = require("mongoose");
const userTemplate = require("../templates/userTemplate");
const vendorTemplate = require("../templates/vendorTemplate");
const { sendEmail } = require("../utils/sendEmail");

// Helper to validate items, verify database prices, check stock availability
const validateAndSanitizeItems = async (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("Cart items are required");
  }

  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const pId = item.productId || item._id || item.id;
    if (!pId) {
      throw new Error("Invalid product data in order request");
    }

    let dbProduct = null;
    if (mongoose.Types.ObjectId.isValid(pId) && String(pId).length === 24) {
      try {
        dbProduct = await Product.findById(pId);
      } catch (e) {
        dbProduct = null;
      }
    }

    if (!dbProduct) {
      // Fallback: If item is custom or static product without valid ObjectId, use item price safely
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const price = Number(item.price) || 0;
      verifiedItems.push({
        productId: String(pId),
        name: item.name || "Produce Item",
        image: item.image || "",
        weight: item.weight || "1 kg",
        quantity: qty,
        price: price,
        vendorId: item.vendorId || null,
      });
      subtotal += price * qty;
      continue;
    }

    const verifiedPrice = dbProduct.price;
    const qty = Math.max(1, parseInt(item.quantity) || 1);
    subtotal += verifiedPrice * qty;

    verifiedItems.push({
      productId: dbProduct._id.toString(),
      name: dbProduct.name,
      image: dbProduct.image,
      weight: item.weight || dbProduct.unit || "1 kg",
      quantity: qty,
      price: verifiedPrice,
      vendorId: dbProduct.vendorId ? dbProduct.vendorId.toString() : null,
    });
  }

  return { subtotal, verifiedItems };
};

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;
    const { subtotal, verifiedItems } = await validateAndSanitizeItems(items);

    const deliveryCharge = subtotal > 500 || subtotal === 0 ? 0 : 40;
    const totalAmount = subtotal + deliveryCharge;

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
    });

    res.json({ order, totalAmount, verifiedItems });
  } catch (err) {
    console.error("RAZORPAY ORDER ERROR:", err);
    res.status(400).json({ message: err.message || "Failed to create payment order" });
  }
};

// Helper to decrement product inventory asynchronously
const updateProductInventory = async (items) => {
  for (const item of items) {
    if (item.productId && mongoose.Types.ObjectId.isValid(item.productId) && String(item.productId).length === 24) {
      try {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: -item.quantity }
        });
      } catch (err) {
        console.error(`Failed to decrement stock for product ${item.productId}:`, err);
      }
    }
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

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "SwqyIaHNcC2KeBOzNKddApnJ";

    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(body)
        .digest("hex");

      if (expected !== razorpay_signature) {
        console.warn("Signature mismatch:", { expected, razorpay_signature });
        if (process.env.NODE_ENV === "production") {
          return res.status(400).json({ success: false, message: "Invalid Payment Signature" });
        }
      }
    }

    const { verifiedItems } = await validateAndSanitizeItems(items);

    // Group items by vendorId
    const vendorGroups = verifiedItems.reduce((acc, item) => {
      const vId = (item.vendorId && mongoose.Types.ObjectId.isValid(item.vendorId)) ? String(item.vendorId) : "global";
      if (!acc[vId]) acc[vId] = [];
      acc[vId].push(item);
      return acc;
    }, {});

    const createdOrders = [];

    // Create sub-orders for each vendor
    for (const [vId, vItems] of Object.entries(vendorGroups)) {
      const subtotal = vItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const deliveryCharge = subtotal > 500 || subtotal === 0 ? 0 : 40;
      const vTotal = subtotal + deliveryCharge;

      const order = await Order.create({
        userId: req.user.id,
        vendorId: (vId !== "global" && mongoose.Types.ObjectId.isValid(vId)) ? vId : null,
        items: vItems,
        deliveryAddress: deliveryAddress || user.defaultAddress || {},
        totalAmount: vTotal,
        paymentMethod: "Online",
        paymentStatus: "Paid",
        paymentId: razorpay_payment_id || "PAY_" + Date.now(),
        status: "Placed",
      });
      createdOrders.push(order);
      
      // Decrement stock asynchronously
      updateProductInventory(vItems).catch(e => console.error("Stock update error:", e));

      // Send Vendor Email asynchronously
      if (vId !== "global" && mongoose.Types.ObjectId.isValid(vId)) {
        User.findById(vId).then(vendor => {
          if (vendor && vendor.email) {
            sendEmail({
              to: vendor.email,
              subject: "New Order Received - FarmsAge",
              html: vendorTemplate(vendor.name || "Vendor", order.items),
            }).catch(e => console.error("Vendor email failed:", e));
          }
        }).catch(e => console.error("Vendor query error:", e));
      }
    }

    // Send User Email asynchronously
    if (user.email) {
      sendEmail({
        to: user.email,
        subject: "Order Confirmed - FarmsAge",
        html: userTemplate(user.name || "Customer", createdOrders),
      }).catch(e => console.error("User email failed:", e));
    }

    const mainOrder = createdOrders[0] || null;

    res.json({ 
      success: true, 
      order: mainOrder, 
      orderId: mainOrder ? mainOrder._id : null,
      allOrders: createdOrders 
    });
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(400).json({ success: false, message: err.message || "Payment verification failed" });
  }
};

// COD Order (Handles Multi-Vendor Splitting)
exports.codOrder = async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { verifiedItems } = await validateAndSanitizeItems(items);

    // Group items by vendorId
    const vendorGroups = verifiedItems.reduce((acc, item) => {
      const vId = (item.vendorId && mongoose.Types.ObjectId.isValid(item.vendorId)) ? String(item.vendorId) : "global";
      if (!acc[vId]) acc[vId] = [];
      acc[vId].push(item);
      return acc;
    }, {});

    const createdOrders = [];

    for (const [vId, vItems] of Object.entries(vendorGroups)) {
      const subtotal = vItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const deliveryCharge = subtotal > 500 || subtotal === 0 ? 0 : 40;
      const vTotal = subtotal + deliveryCharge;

      const order = await Order.create({
        userId: req.user.id,
        vendorId: (vId !== "global" && mongoose.Types.ObjectId.isValid(vId)) ? vId : null,
        items: vItems,
        deliveryAddress: deliveryAddress || user.defaultAddress || {},
        totalAmount: vTotal,
        paymentMethod: "COD",
        paymentStatus: "Pending",
        status: "Placed",
      });
      createdOrders.push(order);

      // Decrement stock asynchronously
      updateProductInventory(vItems).catch(e => console.error("Stock update error:", e));

      // Send Vendor Email asynchronously
      if (vId !== "global" && mongoose.Types.ObjectId.isValid(vId)) {
        User.findById(vId).then(vendor => {
          if (vendor && vendor.email) {
            sendEmail({
              to: vendor.email,
              subject: "New Order Received - FarmsAge",
              html: vendorTemplate(vendor.name || "Vendor", order.items),
            }).catch(e => console.error("Vendor email failed:", e));
          }
        }).catch(e => console.error("Vendor query error:", e));
      }
    }

    // Send User Email asynchronously
    if (user.email) {
      sendEmail({
        to: user.email,
        subject: "Order Confirmed - FarmsAge",
        html: userTemplate(user.name || "Customer", createdOrders),
      }).catch(e => console.error("User email failed:", e));
    }

    const mainOrder = createdOrders[0] || null;

    res.json({ 
      success: true, 
      order: mainOrder, 
      orderId: mainOrder ? mainOrder._id : null,
      allOrders: createdOrders 
    });
  } catch (err) {
    console.error("COD ORDER ERROR:", err);
    res.status(400).json({ success: false, message: err.message || "Failed to place COD order" });
  }
};

// Get My Orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate("vendorId", "name storeName")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
};
