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
const razorpay = require("../config/razorpay");

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

async function api(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
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
  console.log("PHASE 4.4 PAYMENT FAILURE & RAZORPAY REFUND TESTS");
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

  // Mock tracking for razorpay.payments.refund
  let refundCallHistory = [];
  let mockRefundFailure = false;
  let mockRefundDelayMs = 0;

  const originalRefund = razorpay.payments.refund;
  razorpay.payments.refund = async (paymentId, params) => {
    refundCallHistory.push({ paymentId, params });
    if (mockRefundDelayMs > 0) {
      await new Promise((r) => setTimeout(r, mockRefundDelayMs));
    }
    if (mockRefundFailure) {
      throw new Error("Razorpay simulated refund gateway error (gateway timeout / balance low)");
    }
    return {
      id: `rfnd_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      payment_id: paymentId,
      amount: params.amount,
      status: "processed",
      notes: params.notes,
    };
  };

  try {
    // ----------------------------------------------------
    // SETUP FIXTURES
    // ----------------------------------------------------
    const testCustomerA = await User.create({
      name: "Phase44 Customer A",
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `p44_cust_a_${Date.now()}@example.com`,
      role: "user",
    });
    createdUserIds.push(testCustomerA._id);
    const tokenA = jwt.sign({ id: testCustomerA._id, role: "user" }, process.env.JWT_SECRET);

    const testCustomerB = await User.create({
      name: "Phase44 Customer B",
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `p44_cust_b_${Date.now()}@example.com`,
      role: "user",
    });
    createdUserIds.push(testCustomerB._id);
    const tokenB = jwt.sign({ id: testCustomerB._id, role: "user" }, process.env.JWT_SECRET);

    const testAdmin = await User.create({
      name: "Phase44 Admin",
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `p44_admin_${Date.now()}@example.com`,
      role: "admin",
    });
    createdUserIds.push(testAdmin._id);
    const tokenAdmin = jwt.sign({ id: testAdmin._id, role: "admin" }, process.env.JWT_SECRET);

    const testVendorA = await User.create({
      name: "Phase44 Vendor A",
      phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `p44_vendor_a_${Date.now()}@example.com`,
      role: "vendor",
      shopStatus: "approved",
    });
    createdUserIds.push(testVendorA._id);
    const tokenVendorA = jwt.sign({ id: testVendorA._id, role: "vendor" }, process.env.JWT_SECRET);

    const testVendorB = await User.create({
      name: "Phase44 Vendor B",
      phone: `93${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `p44_vendor_b_${Date.now()}@example.com`,
      role: "vendor",
      shopStatus: "approved",
    });
    createdUserIds.push(testVendorB._id);
    const tokenVendorB = jwt.sign({ id: testVendorB._id, role: "vendor" }, process.env.JWT_SECRET);

    const initialStockProdA = 100;
    const testProductA = await Product.create({
      name: "Organic Apples",
      category: "Fruits",
      price: 100,
      quantity: initialStockProdA,
      unit: "1 kg",
      image: "https://example.com/apple.jpg",
      vendorId: testVendorA._id,
    });
    createdProductIds.push(testProductA._id);

    const initialStockProdB = 100;
    const testProductB = await Product.create({
      name: "Organic Oranges",
      category: "Fruits",
      price: 80,
      quantity: initialStockProdB,
      unit: "1 kg",
      image: "https://example.com/orange.jpg",
      vendorId: testVendorB._id,
    });
    createdProductIds.push(testProductB._id);

    const validAddress = {
      name: "Jane Doe",
      phone: "9876543210",
      street: "42 Greenfield Lane",
      city: "Bangalore",
      pincode: "560001",
    };

    // ====================================================
    // 1. PAYMENT FAILURE HANDLING (A - D)
    // ====================================================
    console.log("\n--- 1. Payment Failure Handling ---");

    // Create an online pending order
    const orderRes1 = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProductA._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderId1 = orderRes1.data?.order?.id;
    const stockBeforeFail = (await Product.findById(testProductA._id)).quantity;

    // A. payment.failed marks Pending → Failed
    const failPayload1 = JSON.stringify({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: `pay_fail_${Date.now()}`,
            order_id: rzpOrderId1,
          },
        },
      },
    });
    const failSig1 = generateWebhookSignature(failPayload1, webhookSecret);
    const failRes1 = await fetch(`${baseUrl}/api/orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": failSig1,
      },
      body: failPayload1,
    });
    const dbOrder1 = await Order.findOne({ razorpayOrderId: rzpOrderId1 });

    assert(
      failRes1.status === 200 && dbOrder1?.paymentStatus === "Failed",
      "A. payment.failed marks Pending order as paymentStatus: Failed"
    );

    // B. repeated payment.failed is idempotent
    const failResRepeated = await fetch(`${baseUrl}/api/orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": failSig1,
      },
      body: failPayload1,
    });
    const dbOrderRepeated = await Order.findOne({ razorpayOrderId: rzpOrderId1 });

    assert(
      failResRepeated.status === 200 && dbOrderRepeated?.paymentStatus === "Failed",
      "B. Repeated payment.failed webhook is idempotent and harmless"
    );

    // D. payment.failed does not change inventory
    const stockAfterFail = (await Product.findById(testProductA._id)).quantity;
    assert(
      stockBeforeFail === stockAfterFail && dbOrder1?.inventoryDeducted === false,
      `D. payment.failed does not decrement product inventory (${stockBeforeFail} === ${stockAfterFail})`
    );

    // C. payment.failed cannot change Paid → Failed
    // Create and verify an order to Paid
    const orderRes2 = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProductA._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderId2 = orderRes2.data?.order?.id;
    const payId2 = `pay_success_${Date.now()}`;
    const sig2 = generateSignature(rzpOrderId2, payId2, keySecret);

    await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderId2,
        razorpay_payment_id: payId2,
        razorpay_signature: sig2,
      }),
    });

    const dbOrderPaid2 = await Order.findOne({ razorpayOrderId: rzpOrderId2 });
    assert(dbOrderPaid2?.paymentStatus === "Paid", "Setup: Order 2 verified as Paid");

    const failPayload2 = JSON.stringify({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: `pay_fail_attempt_${Date.now()}`,
            order_id: rzpOrderId2,
          },
        },
      },
    });
    const failSig2 = generateWebhookSignature(failPayload2, webhookSecret);
    await fetch(`${baseUrl}/api/orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": failSig2,
      },
      body: failPayload2,
    });
    const dbOrderAfterFailAttempt = await Order.findOne({ razorpayOrderId: rzpOrderId2 });

    assert(
      dbOrderAfterFailAttempt?.paymentStatus === "Paid",
      "C. payment.failed cannot change Paid order to Failed (Paid state protected)"
    );

    // ====================================================
    // 2. VERIFY-PAYMENT FAILURES (E - F)
    // ====================================================
    console.log("\n--- 2. Verify-Payment Failures ---");

    // E. Invalid verifyPayment signature
    const orderRes3 = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProductA._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderId3 = orderRes3.data?.order?.id;
    const invalidSigRes = await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderId3,
        razorpay_payment_id: `pay_fake_${Date.now()}`,
        razorpay_signature: "tampered_invalid_signature_hex",
      }),
    });
    const dbOrder3 = await Order.findOne({ razorpayOrderId: rzpOrderId3 });

    assert(
      invalidSigRes.status === 400 && dbOrder3?.paymentStatus === "Pending",
      "E. Invalid verifyPayment signature returns HTTP 400 and preserves order in Pending (not mutated to Paid)"
    );

    // F. Amount mismatch check against Razorpay order
    // Modify DB order amount so it mismatches Razorpay gateway order amount
    await Order.updateOne({ razorpayOrderId: rzpOrderId3 }, { $set: { totalAmount: 99999 } });
    const payId3 = `pay_test_${Date.now()}`;
    const sig3 = generateSignature(rzpOrderId3, payId3, keySecret);
    const amountMismatchRes = await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderId3,
        razorpay_payment_id: payId3,
        razorpay_signature: sig3,
      }),
    });

    assert(
      amountMismatchRes.status === 400,
      "F. Amount mismatch between order and gateway rejected with HTTP 400"
    );

    // ====================================================
    // 3. REFUND ELIGIBILITY & NON-REFUNDABLE CASES (G - J)
    // ====================================================
    console.log("\n--- 3. Refund Eligibility & Non-Refundable Cases ---");
    refundCallHistory = [];

    // G. COD cancellation does not refund
    const codRes = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProductA._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const codOrderId = codRes.data?.order?._id;
    const cancelCodRes = await api(`/api/orders/${codOrderId}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dbCodOrder = await Order.findById(codOrderId);

    assert(
      cancelCodRes.status === 200 &&
      dbCodOrder?.status === "Cancelled" &&
      dbCodOrder?.refundStatus === "None" &&
      refundCallHistory.length === 0,
      "G. COD cancellation restores inventory but never triggers Razorpay refund"
    );

    // H. Unpaid Online cancellation does not refund
    const unpaidOrderRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProductA._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const unpaidDbOrder = await Order.findOne({ razorpayOrderId: unpaidOrderRes.data?.order?.id });
    const cancelUnpaidRes = await api(`/api/orders/${unpaidDbOrder._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dbUnpaidAfterCancel = await Order.findById(unpaidDbOrder._id);

    assert(
      cancelUnpaidRes.status === 200 &&
      dbUnpaidAfterCancel?.status === "Cancelled" &&
      dbUnpaidAfterCancel?.refundStatus === "None" &&
      refundCallHistory.length === 0,
      "H. Unpaid Online cancellation cancels without triggering Razorpay refund"
    );

    // I. Delivered cannot cancel/refund
    // Admin creates an order and sets it to Delivered
    const codResDelivered = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProductA._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const deliveredOrderId = codResDelivered.data?.order?._id;
    await api(`/api/admin/orders/${deliveredOrderId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: "Delivered" }),
    });
    const cancelDeliveredRes = await api(`/api/orders/${deliveredOrderId}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(
      cancelDeliveredRes.status === 400,
      "I. Delivered order cannot be cancelled or refunded (HTTP 400)"
    );

    // J. Cancelled cannot cancel again
    const cancelRepeatedRes = await api(`/api/orders/${codOrderId}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(
      cancelRepeatedRes.status === 400,
      "J. Already Cancelled order cannot be cancelled again (HTTP 400)"
    );

    // ====================================================
    // 4. PAID ONLINE CANCELLATION & REFUND (K - N)
    // ====================================================
    console.log("\n--- 4. Paid Online Cancellation & Refund ---");
    refundCallHistory = [];

    // Setup a Paid Online order
    const orderRes4 = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProductA._id.toString(), quantity: 2 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderId4 = orderRes4.data?.order?.id;
    const payId4 = `pay_online_refund_${Date.now()}`;
    const sig4 = generateSignature(rzpOrderId4, payId4, keySecret);

    await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderId4,
        razorpay_payment_id: payId4,
        razorpay_signature: sig4,
      }),
    });
    const dbOrder4 = await Order.findOne({ razorpayOrderId: rzpOrderId4 });

    // K. Paid Online cancellation calls refund with exact amount
    const cancelRes4 = await api(`/api/orders/${dbOrder4._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const expectedPaise4 = Math.round(dbOrder4.totalAmount * 100);

    assert(
      cancelRes4.status === 200 &&
      refundCallHistory.length === 1 &&
      refundCallHistory[0].paymentId === payId4 &&
      refundCallHistory[0].params.amount === expectedPaise4,
      `K. Paid Online cancellation calls razorpay.payments.refund with exact amount (${expectedPaise4} paise)`
    );

    // L. Refund fields are stored correctly in DB
    const dbOrder4After = await Order.findById(dbOrder4._id);
    assert(
      dbOrder4After.status === "Cancelled" &&
      dbOrder4After.paymentStatus === "Paid" && // Must remain "Paid" until webhook!
      dbOrder4After.refundStatus === "Pending" &&
      dbOrder4After.refundId !== undefined &&
      dbOrder4After.refundAmount === dbOrder4.totalAmount &&
      dbOrder4After.refundReason === "Customer cancelled order",
      "L. Refund fields (refundStatus: Pending, refundId, refundAmount, refundReason) saved correctly; paymentStatus remains Paid"
    );

    // M. Concurrent cancellation creates only ONE Razorpay refund call
    refundCallHistory = [];
    mockRefundDelayMs = 50; // Add slight delay to widen concurrency window

    const orderResM = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProductA._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderIdM = orderResM.data?.order?.id;
    const payIdM = `pay_conc_refund_${Date.now()}`;
    const sigM = generateSignature(rzpOrderIdM, payIdM, keySecret);
    await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderIdM,
        razorpay_payment_id: payIdM,
        razorpay_signature: sigM,
      }),
    });
    const dbOrderM = await Order.findOne({ razorpayOrderId: rzpOrderIdM });

    // Send 3 concurrent cancellation requests
    const [resM1, resM2, resM3] = await Promise.all([
      api(`/api/orders/${dbOrderM._id}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
      api(`/api/orders/${dbOrderM._id}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
      api(`/api/orders/${dbOrderM._id}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
    ]);
    mockRefundDelayMs = 0;

    assert(
      refundCallHistory.length === 1,
      `M. Concurrent cancellation creates exactly ONE Razorpay refund call (got ${refundCallHistory.length})`
    );

    // N. Simulated Razorpay refund failure sets refundStatus = Failed
    refundCallHistory = [];
    mockRefundFailure = true;

    const orderResN = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProductA._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderIdN = orderResN.data?.order?.id;
    const payIdN = `pay_fail_rfnd_${Date.now()}`;
    const sigN = generateSignature(rzpOrderIdN, payIdN, keySecret);
    await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderIdN,
        razorpay_payment_id: payIdN,
        razorpay_signature: sigN,
      }),
    });
    const dbOrderN = await Order.findOne({ razorpayOrderId: rzpOrderIdN });

    await api(`/api/orders/${dbOrderN._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    mockRefundFailure = false;

    const dbOrderNAfter = await Order.findById(dbOrderN._id);
    assert(
      dbOrderNAfter.refundStatus === "Failed" &&
      dbOrderNAfter.paymentStatus === "Paid",
      "N. Simulated Razorpay refund failure sets refundStatus: Failed without crashing or corrupting paymentStatus"
    );

    // ====================================================
    // 5. MULTI-VENDOR PARTIAL REFUND (O)
    // ====================================================
    console.log("\n--- 5. Multi-Vendor Partial Refund ---");
    refundCallHistory = [];

    const stockA_beforeMV = (await Product.findById(testProductA._id)).quantity;
    const stockB_beforeMV = (await Product.findById(testProductB._id)).quantity;

    // Checkout with items from Vendor A and Vendor B
    const mvRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [
          { productId: testProductA._id.toString(), quantity: 2 }, // Vendor A: 2 * 100 = 200
          { productId: testProductB._id.toString(), quantity: 3 }, // Vendor B: 3 * 80 = 240
        ],
        deliveryAddress: validAddress,
      }),
    });
    const mvRzpOrderId = mvRes.data?.order?.id;
    const mvPayId = `pay_mv_${Date.now()}`;
    const mvSig = generateSignature(mvRzpOrderId, mvPayId, keySecret);

    await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: mvRzpOrderId,
        razorpay_payment_id: mvPayId,
        razorpay_signature: mvSig,
      }),
    });

    const mvSubOrders = await Order.find({ razorpayOrderId: mvRzpOrderId });
    const orderVendorA = mvSubOrders.find((o) => String(o.vendorId) === String(testVendorA._id));
    const orderVendorB = mvSubOrders.find((o) => String(o.vendorId) === String(testVendorB._id));

    assert(
      mvSubOrders.length === 2 &&
      orderVendorA && orderVendorB &&
      orderVendorA.paymentId === mvPayId &&
      orderVendorB.paymentId === mvPayId,
      "Setup: Multi-vendor checkout created 2 sub-orders sharing 1 Razorpay payment ID"
    );

    // Cancel ONLY Vendor A's sub-order via customer cancellation
    const cancelMV_A = await api(`/api/orders/${orderVendorA._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const dbMvA_after = await Order.findById(orderVendorA._id);
    const dbMvB_after = await Order.findById(orderVendorB._id);
    const stockA_afterMV = (await Product.findById(testProductA._id)).quantity;
    const stockB_afterMV = (await Product.findById(testProductB._id)).quantity;
    const expectedPaiseMV_A = Math.round(orderVendorA.totalAmount * 100);

    assert(
      cancelMV_A.status === 200 &&
      refundCallHistory.length === 1 &&
      refundCallHistory[0].params.amount === expectedPaiseMV_A &&
      dbMvA_after.status === "Cancelled" &&
      dbMvA_after.refundStatus === "Pending" &&
      dbMvB_after.status === "Placed" &&
      dbMvB_after.refundStatus === "None" &&
      stockA_afterMV === stockA_beforeMV && // restored Vendor A's 2 items
      stockB_afterMV === stockB_beforeMV - 3, // Vendor B's 3 items remain deducted
      `O. Multi-vendor partial refund: only Vendor A sub-order refunded (${expectedPaiseMV_A} paise), Vendor B remains Placed with deducted stock`
    );

    // ====================================================
    // 6. REFUND WEBHOOKS (P - R)
    // ====================================================
    console.log("\n--- 6. Refund Webhooks ---");

    // P. refund.processed webhook
    const mockRefundId = dbMvA_after.refundId;
    const refundProcessedPayload = JSON.stringify({
      event: "refund.processed",
      payload: {
        refund: {
          entity: {
            id: mockRefundId,
            payment_id: mvPayId,
            amount: expectedPaiseMV_A,
            notes: { orderId: String(orderVendorA._id) },
          },
        },
      },
    });
    const webhookSigP = generateWebhookSignature(refundProcessedPayload, webhookSecret);
    const webhookResP = await fetch(`${baseUrl}/api/orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": webhookSigP,
      },
      body: refundProcessedPayload,
    });
    const dbMvA_processed = await Order.findById(orderVendorA._id);

    assert(
      webhookResP.status === 200 &&
      dbMvA_processed.refundStatus === "Processed" &&
      dbMvA_processed.paymentStatus === "Refunded" &&
      dbMvA_processed.refundedAt !== null,
      "P. refund.processed webhook updates refundStatus: Processed and paymentStatus: Refunded with timestamp"
    );

    // Q. refund.failed webhook
    // Set up an order with refundStatus: Pending
    const orderResQ = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProductA._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const rzpOrderIdQ = orderResQ.data?.order?.id;
    const payIdQ = `pay_rfnd_fail_${Date.now()}`;
    const sigQ = generateSignature(rzpOrderIdQ, payIdQ, keySecret);
    await api("/api/orders/verify-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        razorpay_order_id: rzpOrderIdQ,
        razorpay_payment_id: payIdQ,
        razorpay_signature: sigQ,
      }),
    });
    const dbOrderQ = await Order.findOne({ razorpayOrderId: rzpOrderIdQ });
    await api(`/api/orders/${dbOrderQ._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const cancelledDbOrderQ = await Order.findById(dbOrderQ._id);

    const refundFailedPayload = JSON.stringify({
      event: "refund.failed",
      payload: {
        refund: {
          entity: {
            id: cancelledDbOrderQ.refundId,
            payment_id: payIdQ,
            notes: { orderId: String(cancelledDbOrderQ._id) },
          },
        },
      },
    });
    const webhookSigQ = generateWebhookSignature(refundFailedPayload, webhookSecret);
    const webhookResQ = await fetch(`${baseUrl}/api/orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": webhookSigQ,
      },
      body: refundFailedPayload,
    });
    const dbOrderQ_failed = await Order.findById(cancelledDbOrderQ._id);

    assert(
      webhookResQ.status === 200 &&
      dbOrderQ_failed.refundStatus === "Failed" &&
      dbOrderQ_failed.paymentStatus === "Paid", // NOT marked Refunded!
      "Q. refund.failed webhook updates refundStatus: Failed and preserves paymentStatus: Paid"
    );

    // R. Invalid refund webhook signature
    const invalidWebhookRes = await fetch(`${baseUrl}/api/orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": "tampered_webhook_signature",
      },
      body: refundProcessedPayload,
    });

    assert(
      invalidWebhookRes.status === 400,
      "R. Invalid refund webhook signature returns HTTP 400 and rejects processing"
    );

    // ====================================================
    // 7. AUTHORIZATION & IDOR (S - T)
    // ====================================================
    console.log("\n--- 7. Authorization & IDOR Protection ---");

    // S. Customer IDOR protection
    // Customer B attempts to cancel Customer A's order
    const crossCancelRes = await api(`/api/orders/${dbMvB_after._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    assert(
      crossCancelRes.status === 403,
      "S. Customer IDOR protection: Customer B cannot cancel or refund Customer A's order (HTTP 403)"
    );

    // T. Vendor IDOR protection
    // Vendor A attempts to update/cancel Vendor B's sub-order
    const crossVendorCancelRes = await api(`/api/vendor/orders/${dbMvB_after._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Cancelled" }),
    });

    assert(
      crossVendorCancelRes.status === 404,
      "T. Vendor IDOR protection: Vendor A cannot access or cancel Vendor B's sub-order (HTTP 404)"
    );

    // ====================================================
    // 8. TERMINAL STATE HARDENING (U - V)
    // ====================================================
    console.log("\n--- 8. Terminal State Hardening ---");

    // U. Cancelled → other status blocked
    // Admin attempts to change Cancelled order to Accepted
    const adminReviveRes = await api(`/api/admin/orders/${dbOrder4._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: "Accepted" }),
    });

    // Vendor attempts to change Cancelled sub-order to Processing
    const vendorReviveRes = await api(`/api/vendor/orders/${orderVendorA._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Processing" }),
    });

    assert(
      adminReviveRes.status === 400 && vendorReviveRes.status === 400,
      `U. Cancelled → other status strictly blocked in both Admin (got ${adminReviveRes.status}) and Vendor (got ${vendorReviveRes.status}) controllers (HTTP 400)`
    );

    // V. Delivered → other status blocked
    const adminChangeDeliveredRes = await api(`/api/admin/orders/${deliveredOrderId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: "Cancelled" }),
    });

    const vendorChangeDeliveredRes = await api(`/api/vendor/orders/${deliveredOrderId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Processing" }),
    });

    assert(
      adminChangeDeliveredRes.status === 400 && (vendorChangeDeliveredRes.status === 400 || vendorChangeDeliveredRes.status === 404),
      "V. Delivered → other status strictly blocked in both Admin and Vendor controllers (HTTP 400)"
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
    razorpay.payments.refund = originalRefund;
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log("\n==================================================");
  console.log("PHASE 4.4 TEST SUMMARY");
  console.log("==================================================");
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log("ALL PHASE 4.4 TESTS PASSED!\n");
  } else {
    console.error("SOME PHASE 4.4 TESTS FAILED!\n");
    process.exit(1);
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal test error:", err);
    process.exit(1);
  });
