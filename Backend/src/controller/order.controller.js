const razorpay = require("../config/razorpay");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const crypto = require("crypto");
const mongoose = require("mongoose");
const userTemplate = require("../templates/userTemplate");
const vendorTemplate = require("../templates/vendorTemplate");
const orderStatusTemplate = require("../templates/orderStatusTemplate");
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
        inventoryDeducted: false,
        paymentProcessingAt: null,
        emailSent: false,
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

// Helper to safely and idempotently process a paid order and deduct inventory exactly once
const processOrderPaymentSuccess = async ({
  razorpayOrderId,
  paymentId,
  user = null,
  deliveryAddress = null,
}) => {
  if (!razorpayOrderId) {
    throw new Error("Missing razorpayOrderId");
  }

  // 1. Fetch matching internal orders
  let orders = await Order.find({ razorpayOrderId });
  if (!orders || orders.length === 0) {
    return { status: "not_found", message: "No orders found matching this Razorpay order ID" };
  }

  // 2. Idempotency: Check if ALL orders are already Paid and inventory already deducted
  const allAlreadyPaid = orders.every(
    (o) => o.paymentStatus === "Paid" && o.inventoryDeducted === true
  );
  if (allAlreadyPaid) {
    return {
      status: "already_completed",
      orders,
      message: "Order already completed.",
    };
  }

  // 3. Replay Protection: Ensure paymentId is not used by an entirely different Razorpay order
  if (paymentId) {
    const existingOtherPayment = await Order.findOne({
      paymentId: paymentId,
      razorpayOrderId: { $ne: razorpayOrderId },
      paymentStatus: "Paid",
    });
    if (existingOtherPayment) {
      return {
        status: "replay_rejected",
        message: "Payment ID has already been processed for another order. Replay rejected.",
      };
    }
  }

  // 4. Concurrency Guard: Atomically acquire processing lock in MongoDB
  const lockTtlMs = 15000;
  const lockExpiry = new Date(Date.now() - lockTtlMs);

  const claim = await Order.updateMany(
    {
      razorpayOrderId: razorpayOrderId,
      paymentStatus: { $ne: "Paid" },
      inventoryDeducted: false,
      $or: [
        { paymentProcessingAt: null },
        { paymentProcessingAt: { $lt: lockExpiry } },
      ],
    },
    {
      $set: { paymentProcessingAt: new Date() },
    }
  );

  // If another process has the lock, wait and check if it finishes
  if (claim.modifiedCount === 0) {
    for (let attempt = 0; attempt < 25; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      orders = await Order.find({ razorpayOrderId });
      if (orders.every((o) => o.paymentStatus === "Paid" && o.inventoryDeducted === true)) {
        return {
          status: "already_completed",
          orders,
          message: "Order already completed.",
        };
      }
    }
    // Check if Paid even if flag transition was in flight
    orders = await Order.find({ razorpayOrderId });
    if (orders.every((o) => o.paymentStatus === "Paid")) {
      return {
        status: "already_completed",
        orders,
        message: "Order already completed.",
      };
    }
  }

  // 5. Deduct inventory exactly once
  orders = await Order.find({ razorpayOrderId });
  const needsInventoryDeduction = orders.some((o) => !o.inventoryDeducted);

  if (needsInventoryDeduction) {
    const allStoredItems = orders.flatMap((o) => o.items);
    try {
      await updateProductInventoryAtomic(allStoredItems);
    } catch (stockErr) {
      console.error(`STOCK DEDUCTION FAILED for order ${razorpayOrderId}:`, stockErr.message);
      // Release lock and preserve paymentId so customer payment is not lost
      await Order.updateMany(
        { razorpayOrderId, paymentStatus: { $ne: "Paid" } },
        { $set: { paymentProcessingAt: null, paymentId: paymentId || undefined } }
      );
      return {
        status: "stock_exhausted",
        message: `Inventory deduction failed: ${stockErr.message}. Payment details preserved.`,
        error: stockErr,
      };
    }
  }

  // 6. Mark Orders as Paid and Placed
  const completedOrders = [];
  for (const order of orders) {
    order.paymentStatus = "Paid";
    if (paymentId) order.paymentId = paymentId;
    order.status = "Placed";
    order.inventoryDeducted = true;
    order.paymentProcessingAt = null;
    if (deliveryAddress) {
      order.deliveryAddress = deliveryAddress;
    }
    await order.save();
    completedOrders.push(order);

    // Send Vendor Email asynchronously (at most once per sub-order)
    if (!order.emailSent && order.vendorId && mongoose.Types.ObjectId.isValid(order.vendorId)) {
      order.emailSent = true;
      await order.save();
      User.findById(order.vendorId)
        .then((vendor) => {
          if (vendor && vendor.email) {
            sendEmail({
              to: vendor.email,
              subject: "New Order Received - FarmsAge",
              html: vendorTemplate(vendor.name || "Vendor", order.items),
            }).catch((e) => console.error("Vendor email failed:", e));
          }
        })
        .catch((e) => console.error("Vendor query error:", e));
    }
  }

  // Send Customer Email asynchronously (at most once per checkout)
  const targetUser = user || (await User.findById(orders[0]?.userId));
  if (targetUser && targetUser.email && !orders[0].emailSent) {
    orders[0].emailSent = true;
    await orders[0].save();
    sendEmail({
      to: targetUser.email,
      subject: "Order Confirmed - FarmsAge",
      html: userTemplate(targetUser.name || "Customer", completedOrders),
    }).catch((e) => console.error("User email failed:", e));
  }

  return {
    status: "success",
    orders: completedOrders,
    message: "Payment processed successfully.",
  };
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
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing Razorpay payment parameters" });
    }

    if (!keySecret) {
      console.error("FATAL: RAZORPAY_KEY_SECRET is not configured. Cannot verify payment.");
      return res.status(500).json({ success: false, message: "Payment service configuration error" });
    }

    // ─── 1. Cryptographic Signature Verification ───
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

    // ─── 2. Find Stored Orders and Check Ownership ───
    const anyOrder = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!anyOrder) {
      return res.status(404).json({
        success: false,
        message: "No order found matching this payment identifier.",
      });
    }

    if (anyOrder.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Order belongs to another user",
      });
    }

    const storedOrders = await Order.find({
      razorpayOrderId: razorpay_order_id,
      userId: req.user.id,
    });

    // ─── 3. Idempotency Check: If already fully Paid & inventory deducted, return success ───
    const allAlreadyPaid = storedOrders.every(
      (o) => o.paymentStatus === "Paid" && o.inventoryDeducted === true
    );
    if (allAlreadyPaid) {
      return res.json({
        success: true,
        order: storedOrders[0],
        orderId: storedOrders[0]._id,
        allOrders: storedOrders,
        message: "Order already completed.",
      });
    }

    // ─── 4. Replay Protection: Ensure payment ID hasn't been used on a DIFFERENT order ───
    const existingOtherPayment = await Order.findOne({
      paymentId: razorpay_payment_id,
      razorpayOrderId: { $ne: razorpay_order_id },
      paymentStatus: "Paid",
    });
    if (existingOtherPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment ID has already been processed for another order. Replay rejected.",
      });
    }

    // ─── 5. Amount & Currency Verification against Razorpay Order ───
    const expectedTotalAmount = storedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
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
      console.error("Razorpay order verification failed:", fetchErr.message);

      return res.status(502).json({
        success: false,
        message: "Unable to verify payment with Razorpay. Please try again.",
      });
    }

    // ─── 6. Safely Process Payment & Deduct Inventory Exactly Once ───
    const result = await processOrderPaymentSuccess({
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      user,
      deliveryAddress,
    });

    if (result.status === "replay_rejected") {
      return res.status(400).json({ success: false, message: result.message });
    }

    if (result.status === "stock_exhausted") {
      return res.status(400).json({ success: false, message: result.message });
    }

    if (result.status === "not_found") {
      return res.status(404).json({ success: false, message: result.message });
    }

    const completedOrders = result.orders;
    const mainOrder = completedOrders[0] || null;

    res.json({
      success: true,
      order: mainOrder,
      orderId: mainOrder ? mainOrder._id : null,
      allOrders: completedOrders,
      message: result.message,
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
        inventoryDeducted: true,
        paymentProcessingAt: null,
        emailSent: true,
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

    const rawPayload = req.rawBody ? req.rawBody.toString("utf8") : (typeof req.body === "string" ? req.body : JSON.stringify(req.body));

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

    const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;
      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id || razorpayOrderId;

      if (!razorpayOrderId) {
        return res.status(400).json({ status: "error", message: "Missing order ID in webhook payload" });
      }

      const storedOrders = await Order.find({ razorpayOrderId });
      if (!storedOrders || storedOrders.length === 0) {
        return res.status(404).json({ status: "error", message: "No matching internal orders found" });
      }

      // Validate currency and amount if provided in payload
      const expectedTotalAmount = storedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const expectedAmountPaise = Math.round(expectedTotalAmount * 100);

      const webhookAmount = paymentEntity?.amount || orderEntity?.amount || orderEntity?.amount_paid;
      const webhookCurrency = paymentEntity?.currency || orderEntity?.currency;

      if (webhookCurrency && webhookCurrency !== "INR") {
        console.error(`WEBHOOK CURRENCY MISMATCH: Expected INR, got ${webhookCurrency}`);
        return res.status(400).json({ status: "error", message: "Currency mismatch in webhook" });
      }

      if (webhookAmount && Number(webhookAmount) !== expectedAmountPaise) {
        console.error(`WEBHOOK AMOUNT MISMATCH: Server expected ${expectedAmountPaise}, got ${webhookAmount}`);
        return res.status(400).json({ status: "error", message: "Amount mismatch in webhook" });
      }

      const result = await processOrderPaymentSuccess({
        razorpayOrderId,
        paymentId,
      });

      if (result.status === "stock_exhausted") {
        return res.status(200).json({ status: "stock_exhausted", message: result.message });
      }

      return res.status(200).json({ status: "ok", message: result.message });
    } else if (event.event === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        // Only update if current paymentStatus is "Pending".
        // CRITICAL: NEVER overwrite an order that is already "Paid" (Do not allow Paid -> Pending or Paid -> Failed).
        await Order.updateMany(
          {
            razorpayOrderId: razorpayOrderId,
            paymentStatus: "Pending",
          },
          {
            $set: {
              paymentStatus: "Failed",
              ...(paymentId ? { paymentId } : {}),
            },
          }
        );
      }

      return res.status(200).json({ status: "ok", message: "Recorded payment failure" });
    }

    res.status(200).json({ status: "ok", message: `Event ${event.event} received` });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.processOrderPaymentSuccess = processOrderPaymentSuccess;

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

// Helper to safely and atomically restore product inventory if and only if inventory was deducted
const restoreOrderInventoryAtomic = async (orderId) => {
  // Atomically claim the restoration right by transitioning inventoryDeducted from true to false
  const orderClaim = await Order.findOneAndUpdate(
    { _id: orderId, inventoryDeducted: true },
    { $set: { inventoryDeducted: false } },
    { returnDocument: "before" }
  );

  if (!orderClaim) {
    // Either order does not exist or inventory was never deducted (or already restored)
    return false;
  }

  // Restore inventory for each item in the order
  if (Array.isArray(orderClaim.items)) {
    for (const item of orderClaim.items) {
      if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
        const qtyToRestore = Number(item.quantity);
        if (qtyToRestore > 0) {
          const updatedProduct = await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { quantity: qtyToRestore } },
            { returnDocument: "after" }
          );
          if (!updatedProduct) {
            console.warn(`[CANCELLATION WARNING] Product ${item.productId} (${item.name}) no longer exists. Could not increment stock.`);
          }
        }
      }
    }
  }

  return true;
};

// Customer Order Cancellation (Dedicated endpoint: PUT /api/orders/:id/cancel)
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Customer must own the order
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You cannot cancel another customer's order",
      });
    }

    // State validation
    if (order.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Order is already cancelled" });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({ success: false, message: "Delivered orders cannot be cancelled" });
    }

    if (order.status === "OutForDelivery") {
      return res.status(400).json({ success: false, message: "Orders out for delivery cannot be cancelled" });
    }

    const cancellableStates = ["Placed", "Pending", "Accepted", "Packing", "Processing"];
    if (!cancellableStates.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order in state '${order.status}' cannot be cancelled`,
      });
    }

    // Atomically transition status to Cancelled (prevents concurrent double transitions)
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
        status: { $nin: ["Cancelled", "Delivered", "OutForDelivery"] },
      },
      {
        $set: { status: "Cancelled" },
      },
      { returnDocument: "after" }
    );

    if (!updatedOrder) {
      return res.status(400).json({ success: false, message: "Order is already cancelled or delivered" });
    }

    // Atomically restore inventory if previously deducted
    await restoreOrderInventoryAtomic(id);

    // Fetch refreshed order
    const finalOrder = await Order.findById(id);

    // Send customer notification email asynchronously
    const customer = await User.findById(finalOrder.userId);
    if (customer && customer.email) {
      sendEmail({
        to: customer.email,
        subject: `Order Cancelled: #${finalOrder._id.toString().slice(-6)}`,
        html: orderStatusTemplate(customer.name, finalOrder._id.toString().slice(-6), "Cancelled"),
      }).catch((e) => console.error("Cancellation email error:", e));
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order: finalOrder,
    });
  } catch (err) {
    console.error("CUSTOMER CANCELLATION ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to cancel order", error: err.message });
  }
};

exports.restoreOrderInventoryAtomic = restoreOrderInventoryAtomic;
