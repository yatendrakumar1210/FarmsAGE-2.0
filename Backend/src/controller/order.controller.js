const razorpay = require("../config/razorpay");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const crypto = require("crypto");
const userTemplate = require("../templates/userTemplate");
const vendorTemplate = require("../templates/vendorTemplate");
const { sendEmail } = require("../utils/sendEmail");
const User = require("../models/user.model");

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

    // Attempt to lookup product in database
    const dbProduct = await Product.findById(pId);
    if (!dbProduct) {
      // Fallback: If item is custom or mock without valid ObjectId, use item price with safe stock guard
      verifiedItems.push({
        productId: pId,
        name: item.name || "Product",
        image: item.image || "",
        weight: item.weight || "1 kg",
        quantity: Math.max(1, parseInt(item.quantity) || 1),
        price: Number(item.price) || 0,
        vendorId: item.vendorId || null,
      });
      subtotal += (Number(item.price) || 0) * Math.max(1, parseInt(item.quantity) || 1);
      continue;
    }

    if (dbProduct.quantity < item.quantity) {
      throw new Error(`Insufficient stock for '${dbProduct.name}'. Available: ${dbProduct.quantity}`);
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

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Razorpay credentials not configured on server" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
    });

    res.json({ order, totalAmount, verifiedItems });
  } catch (err) {
    console.error("RAZORPAY ORDER ERROR:", err);
    res.status(400).json({ message: err.message });
  }
};

// Helper to decrement product inventory
const updateProductInventory = async (items) => {
  for (const item of items) {
    if (item.productId && item.productId.length === 24) {
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

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid Payment Signature" });
    }

    const { verifiedItems } = await validateAndSanitizeItems(items);

    // 🥡 Group items by vendorId
    const vendorGroups = verifiedItems.reduce((acc, item) => {
      const vId = item.vendorId || "global";
      if (!acc[vId]) acc[vId] = [];
      acc[vId].push(item);
      return acc;
    }, {});

    const createdOrders = [];

    // 🚀 Create sub-orders for each vendor
    for (const [vId, vItems] of Object.entries(vendorGroups)) {
      const subtotal = vItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const deliveryCharge = subtotal > 500 || subtotal === 0 ? 0 : 40;
      const vTotal = subtotal + deliveryCharge;

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
      
      // 📦 Decrement stock for ordered items
      await updateProductInventory(vItems);

      // 📩 Send Vendor Email (if vendor exists)
      if (vId !== "global") {
        const vendor = await User.findById(vId);
        if (vendor && vendor.email) {
          try {
            await sendEmail({
              to: vendor.email,
              subject: "New Order Received",
              html: vendorTemplate(vendor.name, order.items),
            });
          } catch (e) {
            console.error("Vendor email failed:", e);
          }
        }
      }
    }

    // 📩 User Email
    if (user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: "Order Confirmed - FarmsAge",
          html: userTemplate(user.name, createdOrders),
        });
      } catch (e) {
        console.error("User email failed:", e);
      }
    }

    res.json({ success: true, order: createdOrders[0], allOrders: createdOrders });
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(400).json({ message: err.message });
  }
};

// COD Order (Handles Multi-Vendor Splitting)
exports.codOrder = async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { verifiedItems } = await validateAndSanitizeItems(items);

    // 🥡 Group items by vendorId
    const vendorGroups = verifiedItems.reduce((acc, item) => {
      const vId = item.vendorId || "global";
      if (!acc[vId]) acc[vId] = [];
      acc[vId].push(item);
      return acc;
    }, {});

    const createdOrders = [];

    // 🚀 Create sub-orders for each vendor
    for (const [vId, vItems] of Object.entries(vendorGroups)) {
      const subtotal = vItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const deliveryCharge = subtotal > 500 || subtotal === 0 ? 0 : 40;
      const vTotal = subtotal + deliveryCharge;

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

      // 📦 Decrement stock for ordered items
      await updateProductInventory(vItems);

      // 📩 Send Vendor Email (if vendor exists)
      if (vId !== "global") {
        const vendor = await User.findById(vId);
        if (vendor && vendor.email) {
          try {
            await sendEmail({
              to: vendor.email,
              subject: "New Order Received",
              html: vendorTemplate(vendor.name, order.items),
            });
          } catch (e) {
            console.error("Vendor email failed:", e);
          }
        }
      }
    }

    // 📩 User Email
    if (user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: "Order Confirmed - FarmsAge",
          html: userTemplate(user.name, createdOrders),
        });
      } catch (e) {
        console.error("User email failed:", e);
      }
    }

    res.json({ success: true, order: createdOrders[0], allOrders: createdOrders });
  } catch (err) {
    console.error("COD ORDER ERROR:", err);
    res.status(400).json({ message: err.message });
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

