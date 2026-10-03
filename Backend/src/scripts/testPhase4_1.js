const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../app");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");

let server;
let baseUrl;

const createdUserIds = [];
const createdProductIds = [];
const createdOrderIds = [];

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
  console.log("PHASE 4.1 ORDER & ADDRESS VALIDATION TESTS");
  console.log("=========================================\n");

  const connectDB = require("../db/db");
  await connectDB();
  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 200));
  }

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  try {
    // ----------------------------------------------------
    // SETUP FIXTURES
    // ----------------------------------------------------
    const testCustomer = await User.create({
      name: "Step41 Customer",
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `step41_${Date.now()}@example.com`,
      role: "user",
    });
    createdUserIds.push(testCustomer._id);
    const token = jwt.sign({ id: testCustomer._id, role: "user" }, process.env.JWT_SECRET);

    const testVendorA = await User.create({
      name: "Vendor Alpha",
      phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "vendor",
      shopStatus: "approved",
    });
    createdUserIds.push(testVendorA._id);

    const testVendorB = await User.create({
      name: "Vendor Beta",
      phone: `93${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "vendor",
      shopStatus: "approved",
    });
    createdUserIds.push(testVendorB._id);

    const initialStock = 100;
    const testProduct = await Product.create({
      name: "Organic Apples",
      category: "Fruits",
      price: 120,
      quantity: initialStock,
      unit: "1 kg",
      image: "https://example.com/apple.jpg",
      vendorId: testVendorA._id,
    });
    createdProductIds.push(testProduct._id);

    const testProductB = await Product.create({
      name: "Organic Bananas",
      category: "Fruits",
      price: 60,
      quantity: initialStock,
      unit: "1 dozen",
      image: "https://example.com/banana.jpg",
      vendorId: testVendorB._id,
    });
    createdProductIds.push(testProductB._id);

    const validAddress = {
      name: "Rohan Sharma",
      phone: "9876543210",
      street: "123 Green Valley Lane",
      city: "Pune",
      pincode: "411001",
    };

    // ----------------------------------------------------
    // 1. STRICT QUANTITY VALIDATION
    // ----------------------------------------------------
    console.log("\n--- 1. Strict Quantity Validation Tests ---");

    // A. quantity = 1 -> PASS
    const q1Res = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    assert(q1Res.status === 200, "A. quantity = 1 -> PASS (HTTP 200)", JSON.stringify(q1Res.data));

    // B. quantity = 50 -> PASS
    const q50Res = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 50 }],
        deliveryAddress: validAddress,
      }),
    });
    assert(q50Res.status === 200, "B. quantity = 50 -> PASS (HTTP 200)", JSON.stringify(q50Res.data));

    // C. quantity = 0 -> HTTP 400
    const q0Res = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 0 }],
        deliveryAddress: validAddress,
      }),
    });
    assert(q0Res.status === 400, "C. quantity = 0 -> HTTP 400", JSON.stringify(q0Res.data));

    // D. quantity = -5 -> HTTP 400
    const qNegRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: -5 }],
        deliveryAddress: validAddress,
      }),
    });
    assert(qNegRes.status === 400, "D. quantity = -5 -> HTTP 400", JSON.stringify(qNegRes.data));

    // E. quantity = 1.5 -> HTTP 400
    const qDecimalRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 1.5 }],
        deliveryAddress: validAddress,
      }),
    });
    assert(qDecimalRes.status === 400, "E. quantity = 1.5 -> HTTP 400", JSON.stringify(qDecimalRes.data));

    // F. quantity = "abc" -> HTTP 400
    const qStrRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: "abc" }],
        deliveryAddress: validAddress,
      }),
    });
    assert(qStrRes.status === 400, "F. quantity = 'abc' -> HTTP 400", JSON.stringify(qStrRes.data));

    // G. quantity > 50 (e.g. 51) -> HTTP 400
    const q51Res = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 51 }],
        deliveryAddress: validAddress,
      }),
    });
    assert(q51Res.status === 400, "G. quantity > 50 (51) -> HTTP 400", JSON.stringify(q51Res.data));

    // ----------------------------------------------------
    // 2. DELIVERY ADDRESS VALIDATION
    // ----------------------------------------------------
    console.log("\n--- 2. Delivery Address Validation Tests ---");

    // H. missing name -> HTTP 400
    const missingNameRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2 }],
        deliveryAddress: { ...validAddress, name: "" },
      }),
    });
    assert(missingNameRes.status === 400, "H. missing name -> HTTP 400", JSON.stringify(missingNameRes.data));

    // I. missing phone -> HTTP 400
    const missingPhoneRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2 }],
        deliveryAddress: { ...validAddress, phone: "" },
      }),
    });
    assert(missingPhoneRes.status === 400, "I. missing phone -> HTTP 400", JSON.stringify(missingPhoneRes.data));

    // J. missing street -> HTTP 400
    const missingStreetRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2 }],
        deliveryAddress: { ...validAddress, street: "   " },
      }),
    });
    assert(missingStreetRes.status === 400, "J. missing street -> HTTP 400", JSON.stringify(missingStreetRes.data));

    // K. missing city -> HTTP 400
    const missingCityRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2 }],
        deliveryAddress: { ...validAddress, city: "" },
      }),
    });
    assert(missingCityRes.status === 400, "K. missing city -> HTTP 400", JSON.stringify(missingCityRes.data));

    // L. missing pincode -> HTTP 400
    const missingPincodeRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2 }],
        deliveryAddress: { ...validAddress, pincode: "" },
      }),
    });
    assert(missingPincodeRes.status === 400, "L. missing pincode -> HTTP 400", JSON.stringify(missingPincodeRes.data));

    // M. valid address -> PASS
    const validAddrRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2 }],
        deliveryAddress: validAddress,
      }),
    });
    assert(validAddrRes.status === 200, "M. valid address -> PASS (HTTP 200)", JSON.stringify(validAddrRes.data));

    // ----------------------------------------------------
    // 3. INTEGRITY & SIDE-EFFECT CHECKS
    // ----------------------------------------------------
    console.log("\n--- 3. Side-Effect & Security Integrity Tests ---");

    // N, O, P: Verify rejected input did not modify stock, create order, or create Razorpay order
    const countOrdersBefore = await Order.countDocuments({ userId: testCustomer._id });
    // Attempt invalid COD order
    const rejectedCodRes = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: -10 }],
        deliveryAddress: validAddress,
      }),
    });
    assert(rejectedCodRes.status === 400, "N/O/P. Invalid COD quantity rejected with HTTP 400");

    const countOrdersAfter = await Order.countDocuments({ userId: testCustomer._id });
    assert(countOrdersBefore === countOrdersAfter, "N. Invalid input must not create an order document in DB");

    const refreshedProduct = await Product.findById(testProduct._id);
    assert(refreshedProduct.quantity === initialStock, "P. Invalid input must not modify stock (stock remains 100)");

    // Q. Existing price-tampering protection remains intact
    const tamperRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2, price: 1 }], // Attempting to buy for Rs 1
        deliveryAddress: validAddress,
      }),
    });
    // DB price is 120, qty=2 -> subtotal=240, deliveryCharge=40 -> total=280
    assert(
      tamperRes.status === 200 && tamperRes.data?.totalAmount === 280,
      "Q. Existing price-tampering protection intact (server computes authoritative Rs 280, ignores Rs 1)"
    );

    // R. Existing COD flow remains functional & consistent multi-vendor delivery fee
    const codRes = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [
          { productId: testProduct._id.toString(), quantity: 1 },  // Vendor A: 120
          { productId: testProductB._id.toString(), quantity: 1 }, // Vendor B: 60
        ],
        deliveryAddress: validAddress,
      }),
    });
    // Overall subtotal = 180 <= 500, deliveryCharge = 40. Total = 220.
    // Multi-vendor rule: deliveryCharge (40) added once to first sub-order, second sub-order gets 0.
    const codOrders = codRes.data?.allOrders || [];
    const sumTotalAmount = codOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    assert(
      codRes.status === 200 &&
      codOrders.length === 2 &&
      sumTotalAmount === 220,
      "R. COD flow functional with consistent multi-vendor delivery charge (Total Rs 220: subtotal 180 + delivery 40 once)"
    );

    // S. Existing online checkout flow remains functional
    const onlineRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2 }],
        deliveryAddress: validAddress,
      }),
    });
    assert(
      onlineRes.status === 200 &&
      onlineRes.data?.order?.id &&
      onlineRes.data?.order?.amount === 28000,
      "S. Online checkout flow functional (returns valid Razorpay order with 28000 paise)"
    );

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log("\n--- Cleaning Up Test Fixtures ---");
    await User.deleteMany({ _id: { $in: createdUserIds } });
    await Product.deleteMany({ _id: { $in: createdProductIds } });
    await Order.deleteMany({ userId: testCustomer._id });
    console.log("Cleaned up test fixtures.");

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log("\n=========================================");
  console.log("PHASE 4.1 TEST SUMMARY");
  console.log("=========================================");
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log("ALL PHASE 4.1 TESTS PASSED!\n");
  } else {
    console.error("SOME PHASE 4.1 TESTS FAILED!\n");
    process.exit(1);
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal test error:", err);
    process.exit(1);
  });
