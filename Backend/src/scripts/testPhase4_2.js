const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const crypto = require("crypto");
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

function generateSignature(orderId, paymentId, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

function generateWebhookSignature(payloadString, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");
}

async function run() {
  console.log("==================================================");
  console.log("PHASE 4.2 RAZORPAY PAYMENT & WEBHOOK TEST SUITE");
  console.log("==================================================\n");

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

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

  try {
    // ----------------------------------------------------
    // SETUP FIXTURES
    // ----------------------------------------------------
    const testCustomerA = await User.create({
      name: "Phase42 Customer A",
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `phase42_a_${Date.now()}@example.com`,
      role: "user",
    });
    createdUserIds.push(testCustomerA._id);
    const tokenA = jwt.sign({ id: testCustomerA._id, role: "user" }, process.env.JWT_SECRET);

    const testCustomerB = await User.create({
      name: "Phase42 Customer B",
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `phase42_b_${Date.now()}@example.com`,
      role: "user",
    });
    createdUserIds.push(testCustomerB._id);
    const tokenB = jwt.sign({ id: testCustomerB._id, role: "user" }, process.env.JWT_SECRET);

    const testVendor = await User.create({
      name: "Phase42 Vendor",
      phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `phase42_v_${Date.now()}@example.com`,
      role: "vendor",
      shopStatus: "approved",
    });
    createdUserIds.push(testVendor._id);

    const testVendorB = await User.create({
      name: "Phase42 Vendor B",
      phone: `93${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `phase42_vb_${Date.now()}@example.com`,
      role: "vendor",
      shopStatus: "approved",
    });
    createdUserIds.push(testVendorB._id);

    const initialStock = 200;
    const testProduct = await Product.create({
      name: "Organic Mangoes",
      category: "Fruits",
      price: 150,
      quantity: initialStock,
      unit: "1 kg",
      image: "https://example.com/mango.jpg",
      vendorId: testVendor._id,
    });
    createdProductIds.push(testProduct._id);

    const testProductB = await Product.create({
      name: "Organic Guavas",
      category: "Fruits",
      price: 80,
      quantity: 150,
      unit: "1 kg",
      image: "https://example.com/guava.jpg",
      vendorId: testVendorB._id,
    });
    createdProductIds.push(testProductB._id);

    const validAddress = {
      name: "Test Customer",
      phone: "9876543210",
      street: "Green Farm Road",
      city: "Bangalore",
      pincode: "560001",
    };

    // ====================================================
    // A. Valid payment verification
    // ====================================================
    console.log("--- 1. Verification Security & Parameter Checks ---");

    const orderResA = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderIdA = orderResA.data?.order?.id;
    const payIdA = `pay_test_${Date.now()}_A`;
    const sigA = generateSignature(rzpOrderIdA, payIdA, keySecret);

    const verifyResA = await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderIdA,
        razorpay_payment_id: payIdA,
        razorpay_signature: sigA,
      }),
    });

    const dbOrderA = await Order.findOne({ razorpayOrderId: rzpOrderIdA });
    assert(
      verifyResA.status === 200 &&
      verifyResA.data?.success === true &&
      dbOrderA?.paymentStatus === "Paid" &&
      dbOrderA?.inventoryDeducted === true,
      "A. Valid payment verification marks Paid and inventoryDeducted: true"
    );

    // ====================================================
    // B. Invalid signature rejected
    // ====================================================
    const orderResB = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderIdB = orderResB.data?.order?.id;
    const payIdB = `pay_test_${Date.now()}_B`;

    const verifyResB = await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderIdB,
        razorpay_payment_id: payIdB,
        razorpay_signature: "invalid_cryptographic_signature_12345",
      }),
    });
    const dbOrderB = await Order.findOne({ razorpayOrderId: rzpOrderIdB });
    assert(
      verifyResB.status === 400 &&
      dbOrderB?.paymentStatus === "Pending" &&
      dbOrderB?.inventoryDeducted === false,
      "B. Invalid signature rejected (HTTP 400, order remains Pending, inventoryDeducted: false)"
    );

    // ====================================================
    // C. Wrong Razorpay order ID rejected
    // ====================================================
    const nonExistentOrderId = "order_NonExistent99999";
    const payIdC = `pay_test_${Date.now()}_C`;
    const sigC = generateSignature(nonExistentOrderId, payIdC, keySecret);

    const verifyResC = await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: nonExistentOrderId,
        razorpay_payment_id: payIdC,
        razorpay_signature: sigC,
      }),
    });
    assert(
      verifyResC.status === 404,
      "C. Wrong Razorpay order ID rejected (HTTP 404 not found)"
    );

    // ====================================================
    // D. Wrong amount rejected
    // ====================================================
    const orderResD = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderIdD = orderResD.data?.order?.id;
    // Tamper internal order amount in DB so server amount check against Razorpay fails
    await Order.updateOne({ razorpayOrderId: rzpOrderIdD }, { $set: { totalAmount: 9999 } });
    const payIdD = `pay_test_${Date.now()}_D`;
    const sigD = generateSignature(rzpOrderIdD, payIdD, keySecret);

    const verifyResD = await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderIdD,
        razorpay_payment_id: payIdD,
        razorpay_signature: sigD,
      }),
    });
    assert(
      verifyResD.status === 400 &&
      verifyResD.data?.message?.includes("Payment amount does not match"),
      "D. Wrong amount rejected (HTTP 400 amount mismatch)"
    );

    // ====================================================
    // E. Wrong currency rejected (webhook & internal currency check)
    // ====================================================
    const orderResE = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderIdE = orderResE.data?.order?.id;
    const webhookPayloadE = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: `pay_test_${Date.now()}_E`,
            order_id: rzpOrderIdE,
            amount: 19000,
            currency: "USD", // Wrong currency
          },
        },
      },
    });
    const webhookSigE = generateWebhookSignature(webhookPayloadE, webhookSecret);
    const webhookResE = await fetch(`${baseUrl}/api/orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": webhookSigE,
      },
      body: webhookPayloadE,
    });
    assert(
      webhookResE.status === 400,
      "E. Wrong currency rejected (HTTP 400 currency mismatch in webhook)"
    );

    // ====================================================
    // F. First successful verification decrements stock once
    // G. Repeated verification does not decrement stock again
    // ====================================================
    console.log("\n--- 2. Verification Idempotency & Stock Deductions ---");

    const stockBeforeFG = (await Product.findById(testProduct._id)).quantity;
    const orderResFG = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderIdFG = orderResFG.data?.order?.id;
    const payIdFG = `pay_test_${Date.now()}_FG`;
    const sigFG = generateSignature(rzpOrderIdFG, payIdFG, keySecret);

    const firstVerifyFG = await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderIdFG,
        razorpay_payment_id: payIdFG,
        razorpay_signature: sigFG,
      }),
    });
    const stockAfterFirstFG = (await Product.findById(testProduct._id)).quantity;
    assert(
      firstVerifyFG.status === 200 &&
      stockAfterFirstFG === stockBeforeFG - 2,
      `F. First successful verification decrements stock once (${stockBeforeFG} -> ${stockAfterFirstFG})`
    );

    const secondVerifyFG = await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderIdFG,
        razorpay_payment_id: payIdFG,
        razorpay_signature: sigFG,
      }),
    });
    const stockAfterSecondFG = (await Product.findById(testProduct._id)).quantity;
    assert(
      secondVerifyFG.status === 200 &&
      secondVerifyFG.data?.message?.includes("already completed") &&
      stockAfterSecondFG === stockAfterFirstFG,
      `G. Repeated verification does not decrement stock again (Stock remains ${stockAfterSecondFG})`
    );

    // ====================================================
    // H. Successful webhook decrements stock
    // I. Repeated webhook does not decrement stock again
    // ====================================================
    console.log("\n--- 3. Webhook Handling & Idempotency ---");

    const stockBeforeHI = (await Product.findById(testProduct._id)).quantity;
    const orderResHI = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 3 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderIdHI = orderResHI.data?.order?.id;
    const expectedAmountPaiseHI = orderResHI.data?.order?.amount;
    const payIdHI = `pay_test_${Date.now()}_HI`;

    const webhookPayloadHI = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: payIdHI,
            order_id: rzpOrderIdHI,
            amount: expectedAmountPaiseHI,
            currency: "INR",
          },
        },
      },
    });
    const webhookSigHI = generateWebhookSignature(webhookPayloadHI, webhookSecret);

    const firstWebhookHI = await fetch(`${baseUrl}/api/orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": webhookSigHI,
      },
      body: webhookPayloadHI,
    });
    const dbOrderHI = await Order.findOne({ razorpayOrderId: rzpOrderIdHI });
    const stockAfterFirstHI = (await Product.findById(testProduct._id)).quantity;
    assert(
      firstWebhookHI.status === 200 &&
      dbOrderHI?.paymentStatus === "Paid" &&
      dbOrderHI?.inventoryDeducted === true &&
      stockAfterFirstHI === stockBeforeHI - 3,
      `H. Successful webhook decrements stock once (${stockBeforeHI} -> ${stockAfterFirstHI})`
    );

    const secondWebhookHI = await fetch(`${baseUrl}/api/orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": webhookSigHI,
      },
      body: webhookPayloadHI,
    });
    const stockAfterSecondHI = (await Product.findById(testProduct._id)).quantity;
    assert(
      secondWebhookHI.status === 200 &&
      stockAfterSecondHI === stockAfterFirstHI,
      `I. Repeated webhook does not decrement stock again (Stock remains ${stockAfterSecondHI})`
    );

    // ====================================================
    // J. Sequence A: verify-payment → webhook
    // ====================================================
    console.log("\n--- 4. Verify-Payment & Webhook Race Condition Sequences ---");

    const stockBeforeJ = (await Product.findById(testProduct._id)).quantity;
    const orderResJ = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderIdJ = orderResJ.data?.order?.id;
    const payIdJ = `pay_test_${Date.now()}_J`;
    const sigJ = generateSignature(rzpOrderIdJ, payIdJ, keySecret);

    // Step 1: verify-payment arrives first
    const verifyJ = await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderIdJ,
        razorpay_payment_id: payIdJ,
        razorpay_signature: sigJ,
      }),
    });
    const stockMidJ = (await Product.findById(testProduct._id)).quantity;

    // Step 2: webhook arrives second
    const webhookPayloadJ = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: payIdJ,
            order_id: rzpOrderIdJ,
            amount: orderResJ.data?.order?.amount,
            currency: "INR",
          },
        },
      },
    });
    const webhookSigJ = generateWebhookSignature(webhookPayloadJ, webhookSecret);
    const webhookJ = await fetch(`${baseUrl}/api/orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": webhookSigJ,
      },
      body: webhookPayloadJ,
    });
    const stockAfterJ = (await Product.findById(testProduct._id)).quantity;
    assert(
      verifyJ.status === 200 &&
      webhookJ.status === 200 &&
      stockMidJ === stockBeforeJ - 2 &&
      stockAfterJ === stockMidJ,
      `J. Sequence A (verify-payment -> webhook) decrements stock exactly once (${stockBeforeJ} -> ${stockAfterJ})`
    );

    // ====================================================
    // K. Sequence B: webhook → verify-payment
    // ====================================================
    const stockBeforeK = (await Product.findById(testProduct._id)).quantity;
    const orderResK = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderIdK = orderResK.data?.order?.id;
    const payIdK = `pay_test_${Date.now()}_K`;

    // Step 1: webhook arrives first
    const webhookPayloadK = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: payIdK,
            order_id: rzpOrderIdK,
            amount: orderResK.data?.order?.amount,
            currency: "INR",
          },
        },
      },
    });
    const webhookSigK = generateWebhookSignature(webhookPayloadK, webhookSecret);
    const webhookK = await fetch(`${baseUrl}/api/orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": webhookSigK,
      },
      body: webhookPayloadK,
    });
    const stockMidK = (await Product.findById(testProduct._id)).quantity;

    // Step 2: verify-payment arrives second
    const sigK = generateSignature(rzpOrderIdK, payIdK, keySecret);
    const verifyK = await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderIdK,
        razorpay_payment_id: payIdK,
        razorpay_signature: sigK,
      }),
    });
    const stockAfterK = (await Product.findById(testProduct._id)).quantity;
    assert(
      webhookK.status === 200 &&
      verifyK.status === 200 &&
      verifyK.data?.success === true &&
      stockMidK === stockBeforeK - 2 &&
      stockAfterK === stockMidK,
      `K. Sequence B (webhook -> verify-payment) returns idempotent success and decrements stock once (${stockBeforeK} -> ${stockAfterK})`
    );

    // ====================================================
    // L. payment.failed sets Failed
    // M. payment.failed does not decrement stock
    // ====================================================
    console.log("\n--- 5. Payment Failed Handling ---");

    const stockBeforeLM = (await Product.findById(testProduct._id)).quantity;
    const orderResLM = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 3 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderIdLM = orderResLM.data?.order?.id;
    const payIdLM = `pay_failed_${Date.now()}`;

    const webhookPayloadLM = JSON.stringify({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: payIdLM,
            order_id: rzpOrderIdLM,
            amount: orderResLM.data?.order?.amount,
            status: "failed",
          },
        },
      },
    });
    const webhookSigLM = generateWebhookSignature(webhookPayloadLM, webhookSecret);
    const webhookLM = await fetch(`${baseUrl}/api/orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": webhookSigLM,
      },
      body: webhookPayloadLM,
    });
    const dbOrderLM = await Order.findOne({ razorpayOrderId: rzpOrderIdLM });
    const stockAfterLM = (await Product.findById(testProduct._id)).quantity;

    assert(
      webhookLM.status === 200 &&
      dbOrderLM?.paymentStatus === "Failed",
      "L. payment.failed sets paymentStatus = Failed"
    );

    assert(
      stockAfterLM === stockBeforeLM &&
      dbOrderLM?.inventoryDeducted === false,
      `M. payment.failed does not decrement stock (Stock remains ${stockAfterLM})`
    );

    // ====================================================
    // N. Concurrent/repeated payment processing cannot double-decrement stock
    // ====================================================
    console.log("\n--- 6. High Concurrency Race Condition Protection ---");

    const stockBeforeN = (await Product.findById(testProduct._id)).quantity;
    const orderResN = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 5 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderIdN = orderResN.data?.order?.id;
    const payIdN = `pay_concurrent_${Date.now()}`;
    const sigN = generateSignature(rzpOrderIdN, payIdN, keySecret);

    const webhookPayloadN = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: payIdN,
            order_id: rzpOrderIdN,
            amount: orderResN.data?.order?.amount,
            currency: "INR",
          },
        },
      },
    });
    const webhookSigN = generateWebhookSignature(webhookPayloadN, webhookSecret);

    // Launch 6 concurrent requests simultaneously
    const concurrentRequests = [
      api("/api/orders/verify-payment", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({
          razorpay_order_id: rzpOrderIdN,
          razorpay_payment_id: payIdN,
          razorpay_signature: sigN,
        }),
      }),
      fetch(`${baseUrl}/api/orders/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": webhookSigN,
        },
        body: webhookPayloadN,
      }),
      api("/api/orders/verify-payment", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({
          razorpay_order_id: rzpOrderIdN,
          razorpay_payment_id: payIdN,
          razorpay_signature: sigN,
        }),
      }),
      fetch(`${baseUrl}/api/orders/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": webhookSigN,
        },
        body: webhookPayloadN,
      }),
    ];

    await Promise.all(concurrentRequests);
    const stockAfterN = (await Product.findById(testProduct._id)).quantity;
    const dbOrderN = await Order.findOne({ razorpayOrderId: rzpOrderIdN });

    assert(
      stockAfterN === stockBeforeN - 5 &&
      dbOrderN?.paymentStatus === "Paid" &&
      dbOrderN?.inventoryDeducted === true,
      `N. Concurrent payment processing decrements stock exactly once (Stock ${stockBeforeN} -> ${stockAfterN}, exactly -5)`
    );

    // ====================================================
    // O. Already Paid order cannot return to Pending (or Failed)
    // ====================================================
    console.log("\n--- 7. State Machine Guard & Authorization ---");

    const webhookPayloadO = JSON.stringify({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: `pay_fail_attempt_${Date.now()}`,
            order_id: rzpOrderIdN, // Already Paid order
            amount: orderResN.data?.order?.amount,
          },
        },
      },
    });
    const webhookSigO = generateWebhookSignature(webhookPayloadO, webhookSecret);
    await fetch(`${baseUrl}/api/orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": webhookSigO,
      },
      body: webhookPayloadO,
    });
    const dbOrderO = await Order.findOne({ razorpayOrderId: rzpOrderIdN });
    assert(
      dbOrderO?.paymentStatus === "Paid",
      "O. Already Paid order cannot return to Pending or be overwritten by payment.failed"
    );

    // ====================================================
    // P. Customer authorization remains intact (cross-user access blocked)
    // ====================================================
    const crossVerifyRes = await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenB}` }, // Customer B attempting Customer A's order
      body: JSON.stringify({
        razorpay_order_id: rzpOrderIdN,
        razorpay_payment_id: payIdN,
        razorpay_signature: sigN,
      }),
    });
    assert(
      crossVerifyRes.status === 403,
      "P. Customer authorization intact: cross-user order verification returns HTTP 403 Forbidden"
    );

    // ====================================================
    // Q. Existing COD flow remains intact
    // ====================================================
    const stockBeforeQ = (await Product.findById(testProduct._id)).quantity;
    const codRes = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2 }],
        deliveryAddress: validAddress,
      }),
    });
    const stockAfterQ = (await Product.findById(testProduct._id)).quantity;
    const codOrder = codRes.data?.order;
    const dbCodOrder = await Order.findById(codOrder?._id);

    assert(
      codRes.status === 200 &&
      stockAfterQ === stockBeforeQ - 2 &&
      dbCodOrder?.inventoryDeducted === true &&
      dbCodOrder?.paymentStatus === "Pending",
      `Q. Existing COD flow intact: decrements stock once (${stockBeforeQ} -> ${stockAfterQ}) with inventoryDeducted: true`
    );

    // ====================================================
    // Q2. Multi-Vendor Online Checkout & Verification
    // ====================================================
    console.log("\n--- 8. Multi-Vendor Online Checkout & Verification ---");

    const stockProdA_before = (await Product.findById(testProduct._id)).quantity;
    const stockProdB_before = (await Product.findById(testProductB._id)).quantity;

    const mvOrderRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [
          { productId: testProduct._id.toString(), quantity: 1 },  // Vendor A
          { productId: testProductB._id.toString(), quantity: 2 }, // Vendor B
        ],
        deliveryAddress: validAddress,
      }),
    });
    const mvRzpOrderId = mvOrderRes.data?.order?.id;
    const mvPayId = `pay_mv_${Date.now()}`;
    const mvSig = generateSignature(mvRzpOrderId, mvPayId, keySecret);

    const mvVerifyRes = await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: mvRzpOrderId,
        razorpay_payment_id: mvPayId,
        razorpay_signature: mvSig,
      }),
    });

    const stockProdA_after = (await Product.findById(testProduct._id)).quantity;
    const stockProdB_after = (await Product.findById(testProductB._id)).quantity;
    const mvOrders = await Order.find({ razorpayOrderId: mvRzpOrderId });

    assert(
      mvVerifyRes.status === 200 &&
      mvOrders.length === 2 &&
      mvOrders.every((o) => o.paymentStatus === "Paid" && o.inventoryDeducted === true) &&
      stockProdA_after === stockProdA_before - 1 &&
      stockProdB_after === stockProdB_before - 2,
      `Q2. Multi-vendor online checkout splits into 2 orders, marks both Paid/inventoryDeducted, and decrements both vendor stocks once`
    );

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log("\n--- Cleaning Up Test Fixtures ---");
    await User.deleteMany({ _id: { $in: createdUserIds } });
    await Product.deleteMany({ _id: { $in: createdProductIds } });
    await Order.deleteMany({ userId: { $in: createdUserIds } });
    console.log("Cleaned up test fixtures.");

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log("\n==================================================");
  console.log("PHASE 4.2 TEST SUMMARY");
  console.log("==================================================");
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log("ALL PHASE 4.2 TESTS PASSED!\n");
  } else {
    console.error("SOME PHASE 4.2 TESTS FAILED!\n");
    process.exit(1);
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal test error:", err);
    process.exit(1);
  });
