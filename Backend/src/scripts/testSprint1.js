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

// Vendor ID normalizer ported directly from CartContext.jsx for test verification
function normalizeVendorId(vendor) {
  if (!vendor || vendor === "global") return "global";
  if (typeof vendor === "object") {
    const rawId = vendor._id || vendor.id;
    return rawId ? String(rawId).trim() : "global";
  }
  const str = String(vendor).trim();
  return str && str !== "null" && str !== "undefined" ? str : "global";
}

async function run() {
  console.log("=========================================");
  console.log("SPRINT 1 REPAIR TEST SUITE");
  console.log("=========================================\n");

  const connectDB = require("../db/db");
  await connectDB();
  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 200));
  }

  const port = 52700 + Math.floor(Math.random() * 200);
  server = app.listen(port);
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------
    // FIX 1: Cart Vendor ID Normalization
    // -------------------------------------------------------------
    console.log("--- 1. Cart Vendor ID Normalization Tests ---");

    const vendorIdA = "65a1234567890abcdef12345";
    const vendorIdB = "65b9876543210fedcba54321";

    const objVendorA1 = { _id: vendorIdA, name: "Green Farm", storeName: "Green Store" };
    const objVendorA2 = { _id: vendorIdA, name: "Green Farm", storeName: "Green Store" };
    const objVendorB = { _id: vendorIdB, name: "Blue Farm", storeName: "Blue Store" };

    // 1. Two products from same vendor with vendorId as objects
    assert(
      normalizeVendorId(objVendorA1) === normalizeVendorId(objVendorA2),
      "A. Two products from same vendor as populated objects normalize identically"
    );

    // 2. Two products from same vendor with vendorId as strings
    assert(
      normalizeVendorId(vendorIdA) === normalizeVendorId(vendorIdA),
      "B. Two products from same vendor as strings normalize identically"
    );

    // 3. Equivalent object and string representations
    assert(
      normalizeVendorId(objVendorA1) === normalizeVendorId(vendorIdA),
      "C. Object representation and string representation of same vendor match"
    );

    // 4. Products from different vendors
    assert(
      normalizeVendorId(objVendorA1) !== normalizeVendorId(objVendorB),
      "D. Different vendors correctly distinguish from each other"
    );

    // 5. Global products with vendorId null, undefined, or 'global'
    assert(
      normalizeVendorId(null) === "global" &&
      normalizeVendorId(undefined) === "global" &&
      normalizeVendorId("global") === "global" &&
      normalizeVendorId({ _id: null }) === "global",
      "E. Global products with null/undefined/global consistently normalize to 'global'"
    );

    // 6. Simulation of adding products to cart
    const mockCart = [{ productId: "p1", vendorId: objVendorA1, name: "Apples" }];
    const nextProductSameVendor = { productId: "p2", vendorId: { _id: vendorIdA }, name: "Oranges" };
    const shouldPromptWipe = normalizeVendorId(mockCart[0].vendorId) !== normalizeVendorId(nextProductSameVendor.vendorId);
    assert(
      shouldPromptWipe === false,
      "F. Adding another product from same vendor does NOT trigger store replace prompt"
    );

    const nextProductDiffVendor = { productId: "p3", vendorId: objVendorB, name: "Milk" };
    const shouldPromptDiffWipe = normalizeVendorId(mockCart[0].vendorId) !== normalizeVendorId(nextProductDiffVendor.vendorId);
    assert(
      shouldPromptDiffWipe === true,
      "G. Adding product from different vendor DOES trigger store replace prompt"
    );

    // -------------------------------------------------------------
    // SETUP FIXTURES FOR FIXES 2, 3, 4, 5
    // -------------------------------------------------------------
    const timestamp = Date.now();
    const vendorA = await User.create({
      name: "Sprint 1 Vendor A",
      email: `s1_vendor_a_${timestamp}@example.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "vendor",
      shopStatus: "approved",
      storeName: "Vendor A Store",
      storeAddress: "Market Yard A",
    });
    createdUserIds.push(vendorA._id);

    const vendorB = await User.create({
      name: "Sprint 1 Vendor B",
      email: `s1_vendor_b_${timestamp}@example.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "vendor",
      shopStatus: "approved",
      storeName: "Vendor B Store",
      storeAddress: "Market Yard B",
    });
    createdUserIds.push(vendorB._id);

    const customer = await User.create({
      name: "Sprint 1 Customer",
      email: `s1_cust_${timestamp}@example.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "user",
      defaultAddress: {
        name: "Sprint 1 Customer",
        phone: "9876543210",
        street: "Main Street 12",
        city: "Pune",
        pincode: "411001",
      },
    });
    createdUserIds.push(customer._id);

    const deliveryPartner = await User.create({
      name: "Sprint 1 Delivery Partner",
      email: `s1_del_${timestamp}@example.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "delivery",
      deliveryStatus: "approved",
    });
    createdUserIds.push(deliveryPartner._id);

    const admin = await User.create({
      name: "Sprint 1 Admin",
      email: `s1_admin_${timestamp}@example.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "admin",
    });
    createdUserIds.push(admin._id);

    const productA = await Product.create({
      name: "Fresh Spinach",
      category: "Vegetables",
      price: 40,
      quantity: 100,
      image: "https://example.com/spinach.jpg",
      vendorId: vendorA._id,
    });
    createdProductIds.push(productA._id);

    const tokenVendorA = jwt.sign({ id: vendorA._id, role: "vendor" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const tokenVendorB = jwt.sign({ id: vendorB._id, role: "vendor" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const tokenCustomer = jwt.sign({ id: customer._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const tokenDelivery = jwt.sign({ id: deliveryPartner._id, role: "delivery" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const tokenAdmin = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // -------------------------------------------------------------
    // FIX 2: Vendor Order Visibility: Paid, Unpaid, Refunded, COD
    // -------------------------------------------------------------
    console.log("\n--- 2. Vendor Order Visibility & Processing Tests ---");

    // Order 1: Unpaid online order for Vendor A
    const unpaidOnlineOrder = await Order.create({
      userId: customer._id,
      vendorId: vendorA._id,
      items: [{ productId: productA._id.toString(), name: productA.name, quantity: 2, price: 40 }],
      totalAmount: 80,
      paymentMethod: "Online",
      paymentStatus: "Pending",
      status: "Pending",
      inventoryDeducted: false,
      deliveryAddress: customer.defaultAddress,
    });
    createdOrderIds.push(unpaidOnlineOrder._id);

    // Order 2: Paid online order for Vendor A
    const paidOnlineOrder = await Order.create({
      userId: customer._id,
      vendorId: vendorA._id,
      items: [{ productId: productA._id.toString(), name: productA.name, quantity: 1, price: 40 }],
      totalAmount: 40,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      status: "Placed",
      inventoryDeducted: true,
      deliveryAddress: customer.defaultAddress,
    });
    createdOrderIds.push(paidOnlineOrder._id);

    // Order 3: COD order for Vendor A
    const codOrder = await Order.create({
      userId: customer._id,
      vendorId: vendorA._id,
      items: [{ productId: productA._id.toString(), name: productA.name, quantity: 3, price: 40 }],
      totalAmount: 120,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      status: "Placed",
      inventoryDeducted: true,
      deliveryAddress: customer.defaultAddress,
    });
    createdOrderIds.push(codOrder._id);

    // Order 4: Fully refunded online order for Vendor A
    const fullyRefundedOrder = await Order.create({
      userId: customer._id,
      vendorId: vendorA._id,
      items: [{ productId: productA._id.toString(), name: productA.name, quantity: 1, price: 40 }],
      totalAmount: 40,
      paymentMethod: "Online",
      paymentStatus: "Refunded",
      refundStatus: "Processed",
      refundAmount: 40,
      status: "Placed",
      inventoryDeducted: false,
      deliveryAddress: customer.defaultAddress,
    });
    createdOrderIds.push(fullyRefundedOrder._id);

    // Order 5: Partially refunded online order for Vendor A (valid for fulfillment)
    const partiallyRefundedOrder = await Order.create({
      userId: customer._id,
      vendorId: vendorA._id,
      items: [{ productId: productA._id.toString(), name: productA.name, quantity: 2, price: 40 }],
      totalAmount: 80,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      refundStatus: "Processed",
      refundAmount: 30, // ₹30 refunded, ₹50 still paid
      status: "Placed",
      inventoryDeducted: true,
      deliveryAddress: customer.defaultAddress,
    });
    createdOrderIds.push(partiallyRefundedOrder._id);

    // Order 6: Legacy paid online order with missing/unset refund fields (must NOT be hidden)
    const legacyPaidOrder = await Order.create({
      userId: customer._id,
      vendorId: vendorA._id,
      items: [{ productId: productA._id.toString(), name: productA.name, quantity: 1, price: 40 }],
      totalAmount: 40,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      status: "Placed",
      inventoryDeducted: true,
      deliveryAddress: customer.defaultAddress,
    });
    // Unset refund fields to explicitly simulate legacy database documents
    await Order.collection.updateOne(
      { _id: legacyPaidOrder._id },
      { $unset: { refundStatus: "", refundAmount: "", refundId: "", refundReason: "", refundedAt: "" } }
    );
    createdOrderIds.push(legacyPaidOrder._id);

    // Order 7: Fully refunded online order where paymentStatus='Refunded' but refundAmount is 0/missing
    const zeroAmountRefundedOrder = await Order.create({
      userId: customer._id,
      vendorId: vendorA._id,
      items: [{ productId: productA._id.toString(), name: productA.name, quantity: 1, price: 40 }],
      totalAmount: 40,
      paymentMethod: "Online",
      paymentStatus: "Refunded",
      refundStatus: "Processed",
      refundAmount: 0,
      status: "Placed",
      inventoryDeducted: false,
      deliveryAddress: customer.defaultAddress,
    });
    createdOrderIds.push(zeroAmountRefundedOrder._id);

    // Vendor A queries orders
    const vendorAOrdersRes = await api("/api/vendor/orders", {
      headers: { Authorization: `Bearer ${tokenVendorA}` },
    });
    assert(vendorAOrdersRes.status === 200, "H. GET /api/vendor/orders returns HTTP 200");

    const vendorAOrderIds = (vendorAOrdersRes.data || []).map((o) => o._id.toString());

    // Unpaid online order must NOT appear
    assert(
      !vendorAOrderIds.includes(unpaidOnlineOrder._id.toString()),
      "I. Unpaid online order does NOT appear in vendor orders feed"
    );

    // Fully refunded online order must NOT appear
    assert(
      !vendorAOrderIds.includes(fullyRefundedOrder._id.toString()),
      "J. Fully refunded online order does NOT appear in vendor orders feed"
    );

    // Fully refunded online order with 0/missing refundAmount must NOT appear
    assert(
      !vendorAOrderIds.includes(zeroAmountRefundedOrder._id.toString()),
      "J2. Fully refunded order with 0/missing refundAmount does NOT appear in vendor orders feed"
    );

    // Paid online order MUST appear
    assert(
      vendorAOrderIds.includes(paidOnlineOrder._id.toString()),
      "K. Paid verified online order DOES appear in vendor orders feed"
    );

    // Partially refunded online order MUST appear
    assert(
      vendorAOrderIds.includes(partiallyRefundedOrder._id.toString()),
      "L. Partially refunded online order DOES appear in vendor orders feed"
    );

    // Legacy paid online order with missing refund fields MUST appear
    assert(
      vendorAOrderIds.includes(legacyPaidOrder._id.toString()),
      "L2. Legacy paid order with missing/default refund fields DOES appear in vendor feed (not hidden)"
    );

    // COD order MUST appear
    assert(
      vendorAOrderIds.includes(codOrder._id.toString()),
      "M. COD order DOES appear in vendor orders feed"
    );

    // Vendor attempts to update status of unpaid online order directly -> 400
    const updateUnpaidRes = await api(`/api/vendor/orders/${unpaidOnlineOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Accepted" }),
    });
    assert(
      updateUnpaidRes.status === 400,
      "N. Vendor cannot update status of unpaid online order (returns HTTP 400)"
    );

    // Vendor attempts to update status of fully refunded online order -> 400
    const updateFullyRefundedRes = await api(`/api/vendor/orders/${fullyRefundedOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Accepted" }),
    });
    assert(
      updateFullyRefundedRes.status === 400,
      "O. Vendor cannot process fully refunded online order (returns HTTP 400)"
    );

    // Vendor attempts to update status of zero-amount refunded order -> 400
    const updateZeroRefundedRes = await api(`/api/vendor/orders/${zeroAmountRefundedOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Accepted" }),
    });
    assert(
      updateZeroRefundedRes.status === 400,
      "O2. Vendor cannot process zero-amount fully refunded order (returns HTTP 400)"
    );

    // Vendor CAN update status of partially refunded online order -> 200
    const updatePartiallyRefundedRes = await api(`/api/vendor/orders/${partiallyRefundedOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Accepted" }),
    });
    assert(
      updatePartiallyRefundedRes.status === 200,
      "P. Vendor CAN process partially refunded online order that remains valid (HTTP 200)"
    );

    // Vendor CAN update status of legacy paid order -> 200
    const updateLegacyRes = await api(`/api/vendor/orders/${legacyPaidOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Accepted" }),
    });
    assert(
      updateLegacyRes.status === 200,
      "P2. Vendor CAN process legacy paid order with missing refund fields (HTTP 200)"
    );

    // Cross-vendor isolation: Vendor B cannot see Vendor A's orders
    const vendorBOrdersRes = await api("/api/vendor/orders", {
      headers: { Authorization: `Bearer ${tokenVendorB}` },
    });
    const vendorBOrderIds = (vendorBOrdersRes.data || []).map((o) => o._id.toString());
    assert(
      !vendorBOrderIds.includes(paidOnlineOrder._id.toString()) &&
      !vendorBOrderIds.includes(codOrder._id.toString()),
      "Q. Vendor B cannot view Vendor A's orders"
    );

    const vendorBHackRes = await api(`/api/vendor/orders/${paidOnlineOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorB}` },
      body: JSON.stringify({ status: "Accepted" }),
    });
    assert(
      vendorBHackRes.status === 404,
      "R. Vendor B cannot update Vendor A's order status (returns HTTP 404)"
    );

    // -------------------------------------------------------------
    // FIX 3: Vendor Must See Newly Placed Orders & Valid Status Transitions
    // -------------------------------------------------------------
    console.log("\n--- 3. Vendor Placed Status & Transitions Tests ---");

    // Paid online order and COD order both have status "Placed"
    const foundPaidOrder = (vendorAOrdersRes.data || []).find((o) => o._id.toString() === paidOnlineOrder._id.toString());
    assert(
      foundPaidOrder && foundPaidOrder.status === "Placed",
      "S. Paid online order appears with status 'Placed'"
    );

    const foundCodOrder = (vendorAOrdersRes.data || []).find((o) => o._id.toString() === codOrder._id.toString());
    assert(
      foundCodOrder && foundCodOrder.status === "Placed",
      "T. COD order appears with status 'Placed'"
    );

    // ATTEMPT TO SKIP PREPARATION STEPS (MUST BE REJECTED)
    // 1. Placed -> Packing directly (skipping Accepted) -> REJECTED (400)
    const skipToPackingRes = await api(`/api/vendor/orders/${codOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Packing" }),
    });
    assert(
      skipToPackingRes.status === 400,
      "U1. Skipping preparation step: Placed -> Packing directly is blocked (HTTP 400)"
    );

    // 2. Placed -> Processing directly (skipping Accepted and Packing) -> REJECTED (400)
    const skipToProcessingRes = await api(`/api/vendor/orders/${codOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Processing" }),
    });
    assert(
      skipToProcessingRes.status === 400,
      "U2. Skipping preparation steps: Placed -> Processing directly is blocked (HTTP 400)"
    );

    // Sequential forward transition lifecycle on COD order: Placed -> Accepted -> Packing -> Processing
    const codToAcceptedRes = await api(`/api/vendor/orders/${codOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Accepted" }),
    });
    assert(
      codToAcceptedRes.status === 200 && codToAcceptedRes.data.status === "Accepted",
      "U. Forward transition: Placed -> Accepted succeeds (HTTP 200)"
    );

    // 3. Accepted -> Processing directly (skipping Packing) -> REJECTED (400)
    const skipAcceptedToProcessingRes = await api(`/api/vendor/orders/${codOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Processing" }),
    });
    assert(
      skipAcceptedToProcessingRes.status === 400,
      "U3. Skipping packing step: Accepted -> Processing directly is blocked (HTTP 400)"
    );

    const codToPackingRes = await api(`/api/vendor/orders/${codOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Packing" }),
    });
    assert(
      codToPackingRes.status === 200 && codToPackingRes.data.status === "Packing",
      "V. Forward transition: Accepted -> Packing succeeds (HTTP 200)"
    );

    const codToProcessingRes = await api(`/api/vendor/orders/${codOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Processing" }),
    });
    assert(
      codToProcessingRes.status === 200 && codToProcessingRes.data.status === "Processing",
      "W. Forward transition: Packing -> Processing succeeds (HTTP 200)"
    );

    // Backward transitions from Processing -> MUST BE REJECTED (400)
    const procToPlacedRes = await api(`/api/vendor/orders/${codOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Placed" }),
    });
    assert(
      procToPlacedRes.status === 400,
      "X. Backward transition from Processing -> Placed blocked (HTTP 400)"
    );

    const procToAcceptedRes = await api(`/api/vendor/orders/${codOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Accepted" }),
    });
    assert(
      procToAcceptedRes.status === 400,
      "Y. Backward transition from Processing -> Accepted blocked (HTTP 400)"
    );

    const procToPackingRes = await api(`/api/vendor/orders/${codOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Packing" }),
    });
    assert(
      procToPackingRes.status === 400,
      "Z. Backward transition from Processing -> Packing blocked (HTTP 400)"
    );

    // Vendor attempts to bypass delivery process by marking OutForDelivery directly -> BLOCKED (400)
    const bypassToOutForDeliveryRes = await api(`/api/vendor/orders/${codOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "OutForDelivery" }),
    });
    assert(
      bypassToOutForDeliveryRes.status === 400,
      "AA. Vendor CANNOT mark order OutForDelivery to bypass delivery (returns HTTP 400)"
    );

    // Vendor attempts to bypass delivery process by marking Delivered directly -> BLOCKED (400)
    const bypassToDeliveredRes = await api(`/api/vendor/orders/${codOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Delivered" }),
    });
    assert(
      bypassToDeliveredRes.status === 400,
      "AB. Vendor CANNOT mark order Delivered to bypass delivery (returns HTTP 400)"
    );

    // Vendor can cancel order from Processing -> ALLOWED (200)
    const procToCancelledRes = await api(`/api/vendor/orders/${codOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Cancelled" }),
    });
    assert(
      procToCancelledRes.status === 200 && procToCancelledRes.data.status === "Cancelled",
      "AC. Vendor can cancel order from Processing (HTTP 200)"
    );

    // Terminal order cannot be changed after Cancelled -> BLOCKED (400)
    const cancelledReviveRes = await api(`/api/vendor/orders/${codOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Accepted" }),
    });
    assert(
      cancelledReviveRes.status === 400,
      "AD. Terminal Cancelled order cannot be revived or modified (HTTP 400)"
    );

    // -------------------------------------------------------------
    // FIX 4: Admin Processing Option & Transition Integrity
    // -------------------------------------------------------------
    console.log("\n--- 4. Admin Processing Option & Transition Tests ---");

    // Admin transitions paidOnlineOrder to Processing
    const adminToProcessingRes = await api(`/api/admin/orders/${paidOnlineOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: "Processing" }),
    });
    assert(
      adminToProcessingRes.status === 200 && adminToProcessingRes.data.status === "Processing",
      "AE. Admin can transition order to Processing (HTTP 200)"
    );

    // Admin transitions paidOnlineOrder to Cancelled
    const adminCancelRes = await api(`/api/admin/orders/${paidOnlineOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: "Cancelled" }),
    });
    assert(
      adminCancelRes.status === 200 && adminCancelRes.data.status === "Cancelled",
      "AF. Admin can transition order to Cancelled (HTTP 200)"
    );

    // Terminal state protection: Cancelled order cannot be changed by Admin
    const adminReviveRes = await api(`/api/admin/orders/${paidOnlineOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: "Processing" }),
    });
    assert(
      adminReviveRes.status === 400,
      "AG. Admin cannot modify terminal Cancelled order (returns HTTP 400)"
    );

    // -------------------------------------------------------------
    // FIX 5: Strict Vendor/Customer Role Isolation & Authoritative Role Enforcement
    // -------------------------------------------------------------
    console.log("\n--- 5. Strict Role Isolation on Order Creation Tests ---");

    const orderPayload = {
      items: [{ productId: productA._id.toString(), quantity: 1 }],
      deliveryAddress: customer.defaultAddress,
    };

    // Vendor cannot place customer COD order
    const vendorCodRes = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify(orderPayload),
    });
    assert(
      vendorCodRes.status === 403,
      "AH. Vendor account blocked from placing customer COD orders (HTTP 403)"
    );

    // Vendor cannot place customer online order
    const vendorOnlineRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify(orderPayload),
    });
    assert(
      vendorOnlineRes.status === 403,
      "AI. Vendor account blocked from placing customer online orders (HTTP 403)"
    );

    // Delivery partner cannot place customer COD order
    const deliveryCodRes = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenDelivery}` },
      body: JSON.stringify(orderPayload),
    });
    assert(
      deliveryCodRes.status === 403,
      "AJ. Delivery partner account blocked from placing customer COD orders (HTTP 403)"
    );

    // Admin cannot place customer COD order
    const adminCodRes = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify(orderPayload),
    });
    assert(
      adminCodRes.status === 403,
      "AK. Admin account blocked from placing customer COD orders (HTTP 403)"
    );

    // Admin cannot place customer online order
    const adminOnlineRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify(orderPayload),
    });
    assert(
      adminOnlineRes.status === 403,
      "AL. Admin account blocked from placing customer online orders (HTTP 403)"
    );

    // Client body role forgery cannot override database role
    const forgedRolePayload = {
      ...orderPayload,
      role: "user", // Attempt to forge role in client body
    };
    const forgedAdminCodRes = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify(forgedRolePayload),
    });
    assert(
      forgedAdminCodRes.status === 403,
      "AM. Forged client body role='user' by Admin account is rejected (HTTP 403)"
    );

    // Legitimate customer CAN place customer COD order
    const customerCodRes = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenCustomer}` },
      body: JSON.stringify(orderPayload),
    });
    assert(
      customerCodRes.status === 200 && customerCodRes.data.success === true,
      "AN. Legitimate customer account can successfully place COD orders (HTTP 200)"
    );
    if (customerCodRes.data?.order?._id) {
      createdOrderIds.push(customerCodRes.data.order._id);
    }

    // Legitimate customer CAN initiate customer online order
    const customerOnlineRes = await api("/api/orders/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenCustomer}` },
      body: JSON.stringify(orderPayload),
    });
    assert(
      customerOnlineRes.status === 200 && customerOnlineRes.data.success === true,
      "AO. Legitimate customer account can successfully initiate online orders (HTTP 200)"
    );
    if (customerOnlineRes.data?.order?._id) {
      createdOrderIds.push(customerOnlineRes.data.order._id);
    }
  } catch (err) {
    console.error("Test execution threw error:", err);
    failed++;
  } finally {
    // Cleanup fixtures
    console.log("\n--- Cleaning Up Test Fixtures ---");
    if (createdOrderIds.length > 0) {
      await Order.deleteMany({ _id: { $in: createdOrderIds } });
    }
    if (createdProductIds.length > 0) {
      await Product.deleteMany({ _id: { $in: createdProductIds } });
    }
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    console.log("Cleaned up test fixtures.");

    if (server) {
      server.close();
    }
    await mongoose.connection.close();
  }

  console.log("\n=========================================");
  console.log("SPRINT 1 TEST SUMMARY");
  console.log("=========================================");
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log("ALL SPRINT 1 TESTS PASSED!\n");
  } else {
    console.error("SOME SPRINT 1 TESTS FAILED!\n");
    process.exit(1);
  }
}

run();
