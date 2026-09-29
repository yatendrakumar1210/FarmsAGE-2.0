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
      throw new Error("Invalid product ID in order request");
    }

    let dbProduct = null;
    if (mongoose.Types.ObjectId.isValid(pId) && String(pId).length === 24) {
      dbProduct = await Product.findById(pId);
    }

    if (!dbProduct) {
      throw new Error(`Product with ID '${pId}' not found or unavailable`);
    }

    const qty = Math.max(1, parseInt(item.quantity) || 1);
    if (dbProduct.quantity < qty) {
      throw new Error(`Insufficient stock for '${dbProduct.name}'. Available: ${dbProduct.quantity}, Requested: ${qty}`);
    }

    const verifiedPrice = Number(dbProduct.price);
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

// Helper for ATOMIC product inventory decrements with rollback protection
const updateProductInventoryAtomic = async (items) => {
  const decrementedItems = [];

  try {
    for (const item of items) {
      if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.productId, quantity: { $gte: item.quantity } },
          { $inc: { quantity: -item.quantity } },
          { new: true }
        );

        if (!updatedProduct) {
          throw new Error(`Insufficient stock for '${item.name}' during allocation.`);
        }
        decrementedItems.push(item);
      }
    }
  } catch (err) {
    // Rollback decremented stock if any item in the batch failed
    for (const dItem of decrementedItems) {
      try {
        await Product.findByIdAndUpdate(dItem.productId, {
          $inc: { quantity: dItem.quantity }
        });
      } catch (rollbackErr) {
        console.error(`Rollback stock failed for product ${dItem.productId}:`, rollbackErr);
      }
    }
    throw err;
  }
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
    console.error("RAZORPAY ORDER CREATION ERROR:", err);
    res.status(400).json({ message: err.message || "Failed to create payment order" });
  }
};

// Verify Payment (Handles Multi-Vendor Splitting & Signature Verification)
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

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing Razorpay payment parameters" });
    }

    if (!keySecret) {
      console.warn("RAZORPAY_KEY_SECRET missing in environment; payment signature verification skipped in non-prod mode.");
    } else {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(body)
        .digest("hex");

      if (expected !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Invalid Payment Signature" });
      }
    }

    const { verifiedItems } = await validateAndSanitizeItems(items);

    // Perform atomic stock decrement before order creation
    await updateProductInventoryAtomic(verifiedItems);

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
        paymentId: razorpay_payment_id,
        status: "Placed",
      });
      createdOrders.push(order);

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

// COD Order (Handles Multi-Vendor Splitting & Atomic Stock)
exports.codOrder = async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { verifiedItems } = await validateAndSanitizeItems(items);

    // Perform atomic stock decrement
    await updateProductInventoryAtomic(verifiedItems);

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

// Razorpay Webhook Handler
exports.handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!webhookSecret || !signature) {
      return res.status(400).json({ status: "ignored", message: "Webhook secret or signature missing" });
    }

    const rawPayload = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawPayload)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ status: "error", message: "Invalid webhook signature" });
    }

    const event = req.body;
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        await Order.updateMany(
          { paymentId: razorpayOrderId, paymentStatus: { $ne: "Paid" } },
          { $set: { paymentStatus: "Paid", paymentId: paymentId || razorpayOrderId } }
        );
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    res.status(500).json({ status: "error", message: err.message });
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
