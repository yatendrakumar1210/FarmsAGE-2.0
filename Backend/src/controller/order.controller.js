const razorpay = require("../config/razorpay");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const crypto = require("crypto");
const mongoose = require("mongoose");
const userTemplate = require("../templates/userTemplate");
const vendorTemplate = require("../templates/vendorTemplate");
const { sendEmail } = require("../utils/sendEmail");

// Helper to validate and sanitize delivery address
const validateDeliveryAddress = (addr) => {
  if (!addr || typeof addr !== "object") {
    throw new Error("Delivery address is required");
  }

  const { name, phone, street, city, pincode } = addr;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Recipient name is required in delivery address");
  }

  if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
    throw new Error("Contact phone is required in delivery address");
  }

  if (!street || typeof street !== "string" || street.trim().length === 0) {
    throw new Error("Street address is required in delivery address");
  }

  if (!city || typeof city !== "string" || city.trim().length === 0) {
    throw new Error("City is required in delivery address");
  }

  if (!pincode || typeof pincode !== "string" || pincode.trim().length === 0) {
    throw new Error("Pincode is required in delivery address");
  }

  return {
    name: name.trim(),
    phone: phone.trim(),
    street: street.trim(),
    city: city.trim(),
    pincode: pincode.trim(),
    houseNumber: typeof addr.houseNumber === "string" ? addr.houseNumber.trim() : (addr.houseNumber || ""),
    landmark: typeof addr.landmark === "string" ? addr.landmark.trim() : (addr.landmark || ""),
    latitude: addr.latitude !== undefined && addr.latitude !== null ? Number(addr.latitude) : null,
    longitude: addr.longitude !== undefined && addr.longitude !== null ? Number(addr.longitude) : null,
    label: typeof addr.label === "string" && addr.label.trim() ? addr.label.trim() : "Home",
  };
};

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

    // Strict quantity validation: positive integer between 1 and 50
    const rawQty = item.quantity;
    let qty;
    if (typeof rawQty === "number") {
      if (!Number.isInteger(rawQty)) {
        throw new Error(`Invalid quantity for '${dbProduct.name}'. Quantity must be a whole integer.`);
      }
      qty = rawQty;
    } else if (typeof rawQty === "string" && /^-?\d+(\.\d+)?$/.test(rawQty.trim())) {
      const parsedNum = Number(rawQty.trim());
      if (!Number.isInteger(parsedNum)) {
        throw new Error(`Invalid quantity for '${dbProduct.name}'. Quantity must be a whole integer.`);
      }
      qty = parsedNum;
    } else {
      throw new Error(`Invalid quantity for '${dbProduct.name}'. Quantity must be a positive integer between 1 and 50.`);
    }

    if (qty < 1 || qty > 50) {
      throw new Error(`Invalid quantity for '${dbProduct.name}'. Quantity must be between 1 and 50.`);
    }

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

// Create Razorpay Order with authoritative server-side price/stock verification & pending Order persistence
exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Validate delivery address BEFORE Razorpay order or DB order creation
    const sanitizedAddress = validateDeliveryAddress(deliveryAddress || user.defaultAddress);

    const { subtotal, verifiedItems } = await validateAndSanitizeItems(items);

    const deliveryCharge = subtotal > 500 || subtotal === 0 ? 0 : 40;
    const totalAmount = subtotal + deliveryCharge;

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
    });

    // Group verified items by vendorId
    const vendorGroups = verifiedItems.reduce((acc, item) => {
      const vId = (item.vendorId && mongoose.Types.ObjectId.isValid(item.vendorId)) ? String(item.vendorId) : "global";
      if (!acc[vId]) acc[vId] = [];
      acc[vId].push(item);
      return acc;
    }, {});

    const pendingOrders = [];
    const vendorKeys = Object.keys(vendorGroups);

    for (const vId of vendorKeys) {
      const vItems = vendorGroups[vId];
      const vSubtotal = vItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      // For multi-vendor orders, distribute delivery charge to first sub-order
      const vDelivery = vendorKeys.length === 1 ? deliveryCharge : (vId === vendorKeys[0] ? deliveryCharge : 0);
      const vTotal = vSubtotal + vDelivery;

      const orderDoc = await Order.create({
        userId: req.user.id,
        vendorId: (vId !== "global" && mongoose.Types.ObjectId.isValid(vId)) ? vId : null,
        items: vItems,
        deliveryAddress: sanitizedAddress,
        totalAmount: vTotal,
        paymentMethod: "Online",
        paymentStatus: "Pending",
        status: "Pending",
        razorpayOrderId: razorpayOrder.id,
        currency: "INR",
      });
      pendingOrders.push(orderDoc);
    }

    res.json({
      success: true,
      order: razorpayOrder,
      totalAmount,
      verifiedItems,
      key_id: process.env.RAZORPAY_KEY_ID || "",
    });
  } catch (err) {
    console.error("RAZORPAY ORDER CREATION ERROR:", err);
    res.status(400).json({ success: false, message: err.message || "Failed to create payment order" });
  }
};

// Verify Payment (Handles Multi-Vendor Splitting, Authoritative Verification & Replay Protection)
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      deliveryAddress,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing Razorpay payment parameters" });
    }

    if (!keySecret) {
      console.error("FATAL: RAZORPAY_KEY_SECRET is not configured. Cannot verify payment.");
      return res.status(500).json({ success: false, message: "Payment service configuration error" });
    }

    // ─── 1. Replay Protection: Ensure payment ID hasn't been used already ───
    const existingPayment = await Order.findOne({
      paymentId: razorpay_payment_id,
      paymentStatus: "Paid",
    });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment ID has already been processed. Replay rejected.",
      });
    }

    // ─── 2. Cryptographic Signature Verification ───
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    const expectedBuf = Buffer.from(expected, "utf8");
    const signatureBuf = Buffer.from(razorpay_signature, "utf8");

    if (
      expectedBuf.length !== signatureBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, signatureBuf)
    ) {
      return res.status(400).json({ success: false, message: "Invalid Payment Signature" });
    }

    // ─── 3. Find and Bind to User's Stored Pending Order(s) ───
    const pendingOrders = await Order.find({
      razorpayOrderId: razorpay_order_id,
      userId: req.user.id,
    });

    if (!pendingOrders || pendingOrders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No order found matching this payment identifier.",
      });
    }

    // Idempotency: If already paid, return existing orders without re-deducting stock
    const allAlreadyPaid = pendingOrders.every((o) => o.paymentStatus === "Paid");
    if (allAlreadyPaid) {
      return res.json({
        success: true,
        order: pendingOrders[0],
        orderId: pendingOrders[0]._id,
        allOrders: pendingOrders,
        message: "Order already completed.",
      });
    }

    // ─── 4. Amount Verification against Razorpay Order ───
    const expectedTotalAmount = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const expectedAmountPaise = Math.round(expectedTotalAmount * 100);

    try {
  const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);

  if (!rzpOrder) {
    return res.status(502).json({
      success: false,
      message: "Unable to verify payment order with Razorpay.",
    });
  }

  if (rzpOrder.currency !== "INR") {
    return res.status(400).json({
      success: false,
      message: "Payment currency does not match the order currency.",
    });
  }

  if (rzpOrder.amount !== expectedAmountPaise) {
    console.error(
      `AMOUNT MISMATCH: Server expected ${expectedAmountPaise} paise, Razorpay order has ${rzpOrder.amount}`
    );

    return res.status(400).json({
      success: false,
      message: "Payment amount does not match stored order total.",
    });
  }
} catch (fetchErr) {
  console.error(
    "Razorpay order verification failed:",
    fetchErr.message
  );

  return res.status(502).json({
    success: false,
    message: "Unable to verify payment with Razorpay. Please try again.",
  });
}

    // ─── 5. Atomic Stock Decrement using Authoritative Stored Items ───
    const allStoredItems = pendingOrders.flatMap((o) => o.items);
    await updateProductInventoryAtomic(allStoredItems);

    // ─── 6. Mark Orders as Paid and Placed ───
    const completedOrders = [];
    for (const order of pendingOrders) {
      order.paymentStatus = "Paid";
      order.paymentId = razorpay_payment_id;
      order.status = "Placed";
      if (deliveryAddress) {
        order.deliveryAddress = deliveryAddress;
      }
      await order.save();
      completedOrders.push(order);

      // Send Vendor Email asynchronously
      if (order.vendorId && mongoose.Types.ObjectId.isValid(order.vendorId)) {
        User.findById(order.vendorId).then((vendor) => {
          if (vendor && vendor.email) {
            sendEmail({
              to: vendor.email,
              subject: "New Order Received - FarmsAge",
              html: vendorTemplate(vendor.name || "Vendor", order.items),
            }).catch((e) => console.error("Vendor email failed:", e));
          }
        }).catch((e) => console.error("Vendor query error:", e));
      }
    }

    // Send User Email asynchronously
    if (user.email) {
      sendEmail({
        to: user.email,
        subject: "Order Confirmed - FarmsAge",
        html: userTemplate(user.name || "Customer", completedOrders),
      }).catch((e) => console.error("User email failed:", e));
    }

    const mainOrder = completedOrders[0] || null;

    res.json({
      success: true,
      order: mainOrder,
      orderId: mainOrder ? mainOrder._id : null,
      allOrders: completedOrders,
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
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Validate delivery address BEFORE modifying stock or creating order
    const sanitizedAddress = validateDeliveryAddress(deliveryAddress || user.defaultAddress);

    const { subtotal, verifiedItems } = await validateAndSanitizeItems(items);
    const deliveryCharge = subtotal > 500 || subtotal === 0 ? 0 : 40;

    // Perform atomic stock decrement AFTER all validations pass
    await updateProductInventoryAtomic(verifiedItems);

    // Group items by vendorId
    const vendorGroups = verifiedItems.reduce((acc, item) => {
      const vId = (item.vendorId && mongoose.Types.ObjectId.isValid(item.vendorId)) ? String(item.vendorId) : "global";
      if (!acc[vId]) acc[vId] = [];
      acc[vId].push(item);
      return acc;
    }, {});

    const createdOrders = [];
    const vendorKeys = Object.keys(vendorGroups);

    for (const vId of vendorKeys) {
      const vItems = vendorGroups[vId];
      const vSubtotal = vItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      // For multi-vendor orders, distribute delivery charge to first sub-order (consistent with online checkout)
      const vDelivery = vendorKeys.length === 1 ? deliveryCharge : (vId === vendorKeys[0] ? deliveryCharge : 0);
      const vTotal = vSubtotal + vDelivery;

      const order = await Order.create({
        userId: req.user.id,
        vendorId: (vId !== "global" && mongoose.Types.ObjectId.isValid(vId)) ? vId : null,
        items: vItems,
        deliveryAddress: sanitizedAddress,
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
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!webhookSecret || !signature) {
      return res.status(400).json({ status: "ignored", message: "Webhook secret or signature missing" });
    }

    const rawPayload = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawPayload)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    const signatureBuf = Buffer.from(signature, "utf8");

    if (
      expectedBuf.length !== signatureBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, signatureBuf)
    ) {
      return res.status(400).json({ status: "error", message: "Invalid webhook signature" });
    }

    const event = req.body;
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        await Order.updateMany(
          { razorpayOrderId: razorpayOrderId, paymentStatus: { $ne: "Paid" } },
          { $set: { paymentStatus: "Paid", paymentId: paymentId || razorpayOrderId, status: "Placed" } }
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
