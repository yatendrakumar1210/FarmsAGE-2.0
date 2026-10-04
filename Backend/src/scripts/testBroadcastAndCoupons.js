const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../app");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const Announcement = require("../models/announcement.model");
const Coupon = require("../models/coupon.model");

let server;
let baseUrl;

const createdUserIds = [];
const createdProductIds = [];
const createdOrderIds = [];
const createdCouponIds = [];
const createdAnnouncementIds = [];

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    failed++;
  }
}

async function api(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }
  return { status: response.status, data };
}

async function run() {
  console.log("=========================================");
  console.log("ADMIN BROADCAST & COUPON LIFECYCLE TESTS");
  console.log("=========================================\n");

  const connectDB = require("../db/db");
  await connectDB();
  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 200));
  }

  const port = 5098;
  server = app.listen(port);
  baseUrl = `http://localhost:${port}`;
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const timestamp = Date.now();

    // 1. Create Admin & Customer Users
    const adminUser = await User.create({
      name: "Broadcast Admin",
      email: `admin_broadcast_${timestamp}@test.com`,
      password: "password123",
      role: "admin",
      phone: "9876543210",
    });
    createdUserIds.push(adminUser._id);

    const customerUser = await User.create({
      name: "Coupon Customer",
      email: `customer_coupon_${timestamp}@test.com`,
      password: "password123",
      role: "user",
      phone: "9876543211",
      defaultAddress: {
        name: "Coupon Customer",
        phone: "9876543211",
        street: "Sector 18",
        city: "Noida",
        pincode: "201301",
      },
    });
    createdUserIds.push(customerUser._id);

    const adminToken = jwt.sign(
      { id: adminUser._id.toString(), role: "admin" },
      process.env.JWT_SECRET || "default_jwt_secret"
    );

    const customerToken = jwt.sign(
      { id: customerUser._id.toString(), role: "user" },
      process.env.JWT_SECRET || "default_jwt_secret"
    );

    // 2. Create Test Products
    const productA = await Product.create({
      name: `Organic Mangoes ${timestamp}`,
      price: 100,
      quantity: 50,
      category: "Fruits",
      unit: "1 kg",
      image: "https://example.com/mango.jpg",
    });
    createdProductIds.push(productA._id);

    const productB = await Product.create({
      name: `Organic Apples ${timestamp}`,
      price: 150,
      quantity: 50,
      category: "Fruits",
      unit: "1 kg",
      image: "https://example.com/apple.jpg",
    });
    createdProductIds.push(productB._id);

    console.log("--- 1. ADMIN BROADCAST TESTS ---");
    // Initial broadcast check
    const initialBroadcast = await api("/api/admin/broadcast");
    assert(initialBroadcast.status === 200, "GET /api/admin/broadcast returns 200 without auth");

    // Unauthorized attempt to set broadcast
    const unauthBroadcast = await api("/api/admin/broadcast", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ message: "Customer broadcast" }),
    });
    assert(
      unauthBroadcast.status === 403 || unauthBroadcast.status === 401,
      "Non-admin cannot POST to /api/admin/broadcast",
      `Got status ${unauthBroadcast.status}`
    );

    // Admin sets broadcast
    const setRes = await api("/api/admin/broadcast", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ message: `Flash Sale Live ${timestamp}! 30% Off Everything.` }),
    });
    assert(setRes.status === 200 && setRes.data.success, "Admin successfully sets live broadcast");

    // Public gets updated broadcast
    const updatedBroadcast = await api("/api/admin/broadcast");
    assert(
      updatedBroadcast.data.message === `Flash Sale Live ${timestamp}! 30% Off Everything.`,
      "Storefront receives live broadcast message published by admin"
    );

    // Admin clears broadcast
    const clearRes = await api("/api/admin/broadcast", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(clearRes.status === 200 && clearRes.data.success, "Admin successfully clears live broadcast");

    // Public gets empty broadcast after clearing
    const clearedBroadcast = await api("/api/admin/broadcast");
    assert(clearedBroadcast.data.message === "", "Storefront broadcast is empty after being cleared");

    console.log("\n--- 2. ADMIN DYNAMIC COUPON MANAGEMENT TESTS ---");
    // Non-admin cannot create coupon
    const unauthCoupon = await api("/api/admin/coupons", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ code: "FORGED", discountValue: 50 }),
    });
    assert(
      unauthCoupon.status === 403 || unauthCoupon.status === 401,
      "Non-admin cannot create coupon",
      `Got status ${unauthCoupon.status}`
    );

    // Admin creates percentage coupon with max discount: 20% off, min order 100, max discount 40
    const codePercent = `TESTPERC_${timestamp}`;
    const createPercentRes = await api("/api/admin/coupons", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        code: codePercent,
        discountType: "percentage",
        discountValue: 20,
        minOrderAmount: 100,
        maxDiscount: 40,
      }),
    });
    assert(createPercentRes.status === 201 && createPercentRes.data.code === codePercent, "Admin creates percentage coupon");
    if (createPercentRes.data._id) createdCouponIds.push(createPercentRes.data._id);

    // Admin creates fixed coupon: ₹50 off, min order 200
    const codeFixed = `TESTFIXED_${timestamp}`;
    const createFixedRes = await api("/api/admin/coupons", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        code: codeFixed,
        discountType: "fixed",
        discountValue: 50,
        minOrderAmount: 200,
      }),
    });
    assert(createFixedRes.status === 201 && createFixedRes.data.code === codeFixed, "Admin creates fixed amount coupon");
    if (createFixedRes.data._id) createdCouponIds.push(createFixedRes.data._id);

    // Admin creates expired coupon
    const codeExpired = `EXPIRED_${timestamp}`;
    const createExpiredRes = await api("/api/admin/coupons", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        code: codeExpired,
        discountType: "percentage",
        discountValue: 25,
        expiryDate: new Date(Date.now() - 86400000), // yesterday
      }),
    });
    assert(createExpiredRes.status === 201, "Admin creates expired coupon for validation testing");
    if (createExpiredRes.data._id) createdCouponIds.push(createExpiredRes.data._id);

    // Admin creates inactive coupon
    const codeInactive = `INACTIVE_${timestamp}`;
    const createInactiveRes = await api("/api/admin/coupons", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        code: codeInactive,
        discountType: "percentage",
        discountValue: 20,
        isActive: false,
      }),
    });
    assert(createInactiveRes.status === 201, "Admin creates inactive coupon for validation testing");
    if (createInactiveRes.data._id) createdCouponIds.push(createInactiveRes.data._id);

    // Admin creates usage limit coupon: limit = 1
    const codeLimit = `LIMIT1_${timestamp}`;
    const createLimitRes = await api("/api/admin/coupons", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        code: codeLimit,
        discountType: "fixed",
        discountValue: 30,
        usageLimit: 1,
      }),
    });
    assert(createLimitRes.status === 201, "Admin creates coupon with usage limit = 1");
    if (createLimitRes.data._id) createdCouponIds.push(createLimitRes.data._id);

    // Duplicate coupon code rejection
    const duplicateRes = await api("/api/admin/coupons", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        code: codePercent,
        discountValue: 10,
      }),
    });
    assert(duplicateRes.status === 400, "Duplicate coupon code is rejected (400)");

    // Admin gets all coupons
    const listRes = await api("/api/admin/coupons", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      listRes.status === 200 && Array.isArray(listRes.data) && listRes.data.length >= 5,
      "Admin GET /api/admin/coupons lists all coupons"
    );

    console.log("\n--- 3. CUSTOMER COUPON VALIDATION TESTS ---");
    // Validate percentage coupon (subtotal 150, 20% = 30, cap 40 -> discount = 30)
    const valPercentRes = await api("/api/orders/validate-coupon", {
      method: "POST",
      body: JSON.stringify({
        code: codePercent,
        items: [{ productId: productA._id.toString(), quantity: 1 }], // 100
        subtotal: 100,
      }),
    });
    assert(
      valPercentRes.status === 200 && valPercentRes.data.discountAmount === 20,
      "Customer validates percentage coupon (20% of 100 = 20)"
    );

    // Validate percentage coupon capping at maxDiscount (subtotal 300, 20% = 60, capped at 40)
    const valCappedRes = await api("/api/orders/validate-coupon", {
      method: "POST",
      body: JSON.stringify({
        code: codePercent,
        items: [{ productId: productA._id.toString(), quantity: 3 }], // 300
        subtotal: 300,
      }),
    });
    assert(
      valCappedRes.status === 200 && valCappedRes.data.discountAmount === 40,
      "Discount is properly capped at maxDiscount (₹40 instead of ₹60)"
    );

    // Validate fixed coupon (subtotal 250, discount 50)
    const valFixedRes = await api("/api/orders/validate-coupon", {
      method: "POST",
      body: JSON.stringify({
        code: codeFixed,
        subtotal: 250,
      }),
    });
    assert(
      valFixedRes.status === 200 && valFixedRes.data.discountAmount === 50,
      "Customer validates fixed amount coupon (₹50 discount)"
    );

    // Validate below minimum order condition (codeFixed requires minOrder 200, pass subtotal 100)
    const valBelowMinRes = await api("/api/orders/validate-coupon", {
      method: "POST",
      body: JSON.stringify({
        code: codeFixed,
        subtotal: 100,
      }),
    });
    assert(
      valBelowMinRes.status === 400 && valBelowMinRes.data.message.includes("Minimum order amount"),
      "Coupon rejected when subtotal is below minOrderAmount"
    );

    // Validate expired coupon
    const valExpiredRes = await api("/api/orders/validate-coupon", {
      method: "POST",
      body: JSON.stringify({
        code: codeExpired,
        subtotal: 200,
      }),
    });
    assert(
      valExpiredRes.status === 400 && valExpiredRes.data.message.includes("expired"),
      "Expired coupon rejected safely (400)"
    );

    // Validate inactive coupon
    const valInactiveRes = await api("/api/orders/validate-coupon", {
      method: "POST",
      body: JSON.stringify({
        code: codeInactive,
        subtotal: 200,
      }),
    });
    assert(
      valInactiveRes.status === 400 && valInactiveRes.data.message.includes("inactive"),
      "Inactive coupon rejected safely (400)"
    );

    // Validate non-existent coupon
    const valInvalidRes = await api("/api/orders/validate-coupon", {
      method: "POST",
      body: JSON.stringify({
        code: "DOESNOTEXIST99",
        subtotal: 200,
      }),
    });
    assert(
      valInvalidRes.status === 400 && valInvalidRes.data.message.includes("does not exist"),
      "Non-existent coupon rejected safely (400)"
    );

    console.log("\n--- 4. ORDER CREATION WITH AUTHORITATIVE COUPON DISCOUNT ---");
    // Place COD order with coupon
    // Cart: productA (100) * 2 = 200 subtotal. deliveryCharge = 40 (<=500).
    // Coupon: codePercent (20% of 200 = 40).
    // Authoritative total = 200 - 40 + 40 = 200.
    const codOrderRes = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [{ productId: productA._id.toString(), quantity: 2 }],
        deliveryAddress: customerUser.defaultAddress,
        couponCode: codePercent,
      }),
    });

    assert(codOrderRes.status === 200 && codOrderRes.data.success, "COD order with coupon succeeds");
    if (codOrderRes.data.orderId) createdOrderIds.push(codOrderRes.data.orderId);

    const savedOrder = await Order.findById(codOrderRes.data.orderId);
    assert(
      savedOrder && savedOrder.couponCode === codePercent,
      "Order document persists couponCode in MongoDB"
    );
    assert(
      savedOrder && savedOrder.discountAmount === 40,
      "Order document persists discountAmount in MongoDB (₹40)"
    );
    assert(
      savedOrder && savedOrder.totalAmount === 200,
      "Authoritative totalAmount is 200 (subtotal 200 - discount 40 + delivery 40)"
    );

    // Check that coupon usage count was incremented
    const updatedCoupon = await Coupon.findOne({ code: codePercent });
    assert(
      updatedCoupon && updatedCoupon.usageCount === 1,
      "Coupon usageCount was incremented in MongoDB"
    );

    // Test rejection of invalid coupon in COD order
    const forgedCodRes = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [{ productId: productA._id.toString(), quantity: 1 }],
        deliveryAddress: customerUser.defaultAddress,
        couponCode: "FORGED_COUPON_CODE",
      }),
    });
    assert(
      forgedCodRes.status === 400 && forgedCodRes.data.message.includes("does not exist"),
      "Order creation rejected when invalid couponCode is submitted"
    );

    // Test usage limit coupon enforcement
    // First use: LIMIT1 coupon
    const use1Res = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [{ productId: productA._id.toString(), quantity: 1 }],
        deliveryAddress: customerUser.defaultAddress,
        couponCode: codeLimit,
      }),
    });
    assert(use1Res.status === 200, "First use of coupon with limit = 1 succeeds");
    if (use1Res.data.orderId) createdOrderIds.push(use1Res.data.orderId);

    // Second use: LIMIT1 coupon must be rejected
    const use2Res = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [{ productId: productA._id.toString(), quantity: 1 }],
        deliveryAddress: customerUser.defaultAddress,
        couponCode: codeLimit,
      }),
    });
    assert(
      use2Res.status === 400 && use2Res.data.message.includes("usage limit"),
      "Second use of coupon is rejected when usage limit is reached"
    );

    // Online Razorpay order creation with coupon
    const rzpOrderRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [{ productId: productB._id.toString(), quantity: 2 }], // 300
        deliveryAddress: customerUser.defaultAddress,
        couponCode: codeFixed, // 50 off
      }),
    });
    assert(
      rzpOrderRes.status === 200 && rzpOrderRes.data.discountAmount === 50,
      "Online order creation validates coupon and returns authoritative discount"
    );
    // Subtotal 300, discount 50, delivery 40 -> total = 290
    assert(
      rzpOrderRes.data.totalAmount === 290,
      "Authoritative online order totalAmount is 290"
    );
    // Razorpay order amount in paise should match 290 * 100 = 29000
    assert(
      rzpOrderRes.data.order.amount === 29000,
      "Razorpay order gateway amount matches server-calculated total (29000 paise)"
    );

    // Admin delete coupon
    const deleteRes = await api(`/api/admin/coupons/${createPercentRes.data._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteRes.status === 200, "Admin can delete coupon by ID");

    const deletedCheck = await Coupon.findById(createPercentRes.data._id);
    assert(!deletedCheck, "Deleted coupon no longer exists in MongoDB");

  } catch (err) {
    console.error("Test execution threw error:", err);
    failed++;
  } finally {
    console.log("\n--- CLEANUP TEST DATA ---");
    try {
      if (createdOrderIds.length > 0) {
        await Order.deleteMany({ _id: { $in: createdOrderIds } });
      }
      if (createdProductIds.length > 0) {
        await Product.deleteMany({ _id: { $in: createdProductIds } });
      }
      if (createdUserIds.length > 0) {
        await User.deleteMany({ _id: { $in: createdUserIds } });
      }
      if (createdCouponIds.length > 0) {
        await Coupon.deleteMany({ _id: { $in: createdCouponIds } });
      }
      await Announcement.deleteMany({ isActive: false });
      console.log("  [DONE] Test cleanup complete.");
    } catch (cleanErr) {
      console.error("Cleanup error:", cleanErr);
    }

    if (server) {
      server.close();
    }
    await mongoose.connection.close();

    console.log("\n=========================================");
    console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("=========================================\n");

    process.exit(failed > 0 ? 1 : 0);
  }
}

run();
