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
  console.log("==================================================");
  console.log("PHASE 4.3 ORDER CANCELLATION & STOCK RESTORATION");
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

  try {
    // ----------------------------------------------------
    // SETUP FIXTURES
    // ----------------------------------------------------
    const testCustomerA = await User.create({
      name: "Phase43 Customer A",
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `p43_cust_a_${Date.now()}@example.com`,
      role: "user",
    });
    createdUserIds.push(testCustomerA._id);
    const tokenA = jwt.sign({ id: testCustomerA._id, role: "user" }, process.env.JWT_SECRET);

    const testCustomerB = await User.create({
      name: "Phase43 Customer B",
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `p43_cust_b_${Date.now()}@example.com`,
      role: "user",
    });
    createdUserIds.push(testCustomerB._id);
    const tokenB = jwt.sign({ id: testCustomerB._id, role: "user" }, process.env.JWT_SECRET);

    const testAdmin = await User.create({
      name: "Phase43 Admin",
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `p43_admin_${Date.now()}@example.com`,
      role: "admin",
    });
    createdUserIds.push(testAdmin._id);
    const tokenAdmin = jwt.sign({ id: testAdmin._id, role: "admin" }, process.env.JWT_SECRET);

    const testVendorA = await User.create({
      name: "Phase43 Vendor A",
      phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `p43_venda_${Date.now()}@example.com`,
      role: "vendor",
      shopStatus: "approved",
    });
    createdUserIds.push(testVendorA._id);
    const tokenVendorA = jwt.sign({ id: testVendorA._id, role: "vendor" }, process.env.JWT_SECRET);

    const testVendorB = await User.create({
      name: "Phase43 Vendor B",
      phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `p43_vendb_${Date.now()}@example.com`,
      role: "vendor",
      shopStatus: "approved",
    });
    createdUserIds.push(testVendorB._id);
    const tokenVendorB = jwt.sign({ id: testVendorB._id, role: "vendor" }, process.env.JWT_SECRET);

    const initialStockProdA = 100;
    const testProductA = await Product.create({
      name: "Fresh Strawberries",
      category: "Fruits",
      price: 200,
      quantity: initialStockProdA,
      unit: "500 g",
      image: "https://example.com/strawberry.jpg",
      vendorId: testVendorA._id,
    });
    createdProductIds.push(testProductA._id);

    const initialStockProdB = 100;
    const testProductB = await Product.create({
      name: "Organic Blueberries",
      category: "Fruits",
      price: 250,
      quantity: initialStockProdB,
      unit: "250 g",
      image: "https://example.com/blueberry.jpg",
      vendorId: testVendorB._id,
    });
    createdProductIds.push(testProductB._id);

    const validAddress = {
      name: "P43 Customer",
      phone: "9876543210",
      street: "Berry Orchard St",
      city: "Bangalore",
      pincode: "560001",
    };

    // ====================================================
    // A. Customer can cancel own eligible order
    // ====================================================
    console.log("--- 1. Customer Cancellation Authorization & Validation ---");

    // Place a COD order for Customer A (quantity = 2)
    const stockBeforeA = (await Product.findById(testProductA._id)).quantity;
    const codResA = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProductA._id.toString(), quantity: 2 }],
        deliveryAddress: validAddress,
      }),
    });
    const orderA = codResA.data?.order;
    const stockAfterPlaceA = (await Product.findById(testProductA._id)).quantity;

    // Customer A cancels own order
    const cancelResA = await api(`/api/orders/${orderA._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const stockAfterCancelA = (await Product.findById(testProductA._id)).quantity;
    const dbOrderA = await Order.findById(orderA._id);

    assert(
      cancelResA.status === 200 &&
      cancelResA.data?.success === true &&
      dbOrderA?.status === "Cancelled" &&
      dbOrderA?.inventoryDeducted === false &&
      stockAfterPlaceA === stockBeforeA - 2 &&
      stockAfterCancelA === stockBeforeA,
      "A. Customer can cancel own eligible order and stock is restored"
    );

    // ====================================================
    // B. Customer cannot cancel another customer's order
    // ====================================================
    const codResB = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProductA._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const orderB = codResB.data?.order;

    // Customer B attempts to cancel Customer A's order
    const crossCancelRes = await api(`/api/orders/${orderB._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      crossCancelRes.status === 403,
      "B. Customer cannot cancel another customer's order (HTTP 403 Forbidden)"
    );

    // ====================================================
    // C. Customer cannot cancel Delivered order
    // ====================================================
    // Mark orderB as Delivered in DB
    await Order.findByIdAndUpdate(orderB._id, { status: "Delivered" });
    const cancelDeliveredRes = await api(`/api/orders/${orderB._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      cancelDeliveredRes.status === 400 &&
      cancelDeliveredRes.data?.message?.includes("Delivered"),
      "C. Customer cannot cancel Delivered order (HTTP 400)"
    );

    // ====================================================
    // D. Customer cannot cancel already Cancelled order
    // ====================================================
    // Cancel orderA was already done in Test A; try to cancel again
    const cancelAgainRes = await api(`/api/orders/${orderA._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      cancelAgainRes.status === 400 &&
      cancelAgainRes.data?.message?.includes("already cancelled"),
      "D. Customer cannot cancel already Cancelled order (HTTP 400)"
    );

    // ====================================================
    // E. Customer cannot set arbitrary order status via cancellation endpoint
    // ====================================================
    const codResE = await api("/api/orders/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: testProductA._id.toString(), quantity: 1 }],
        deliveryAddress: validAddress,
      }),
    });
    const orderE = codResE.data?.order;

    // Try sending arbitrary status tampering payload
    const tamperRes = await api(`/api/orders/${orderE._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ status: "Delivered", paymentStatus: "Paid", totalAmount: 0 }),
    });
    const dbOrderE = await Order.findById(orderE._id);
    assert(
      tamperRes.status === 200 &&
      dbOrderE?.status === "Cancelled" &&
      dbOrderE?.paymentStatus === "Pending",
      "E. Customer cannot set arbitrary status: endpoint strictly forces status = Cancelled"
    );

    // ====================================================
    // F. COD cancellation works & paymentStatus remains according to COD lifecycle
    // ====================================================
    console.log("\n--- 2. Payment Status Preservation & Stock Integrity ---");

    assert(
      dbOrderE?.paymentMethod === "COD" &&
      dbOrderE?.paymentStatus === "Pending",
      "F. COD cancellation preserves paymentStatus = Pending"
    );

    // ====================================================
    // G. Paid online cancellation works without falsely changing paymentStatus
    // ====================================================
    // Create a mock Paid online order with inventoryDeducted: true
    const paidOnlineOrder = await Order.create({
      userId: testCustomerA._id,
      vendorId: testVendorA._id,
      items: [{
        productId: testProductA._id.toString(),
        name: testProductA.name,
        quantity: 2,
        price: testProductA.price,
        weight: "500 g",
      }],
      deliveryAddress: validAddress,
      totalAmount: 400,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      status: "Placed",
      inventoryDeducted: true,
    });
    // Manually decrement stock by 2 to simulate previous payment verification
    await Product.findByIdAndUpdate(testProductA._id, { $inc: { quantity: -2 } });

    const stockBeforeG = (await Product.findById(testProductA._id)).quantity;
    const cancelPaidRes = await api(`/api/orders/${paidOnlineOrder._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const stockAfterG = (await Product.findById(testProductA._id)).quantity;
    const dbPaidCancelled = await Order.findById(paidOnlineOrder._id);

    assert(
      cancelPaidRes.status === 200 &&
      dbPaidCancelled?.status === "Cancelled" &&
      dbPaidCancelled?.paymentStatus === "Paid" &&
      stockAfterG === stockBeforeG + 2,
      "G. Paid online cancellation preserves paymentStatus = Paid (no fake refund) and restores stock"
    );

    // ====================================================
    // H. Pending unpaid online order does NOT restore stock if inventoryDeducted=false
    // ====================================================
    const unpaidOnlineOrder = await Order.create({
      userId: testCustomerA._id,
      vendorId: testVendorA._id,
      items: [{
        productId: testProductA._id.toString(),
        name: testProductA.name,
        quantity: 4,
        price: testProductA.price,
        weight: "500 g",
      }],
      deliveryAddress: validAddress,
      totalAmount: 800,
      paymentMethod: "Online",
      paymentStatus: "Pending",
      status: "Pending",
      inventoryDeducted: false, // Never paid, stock never decremented
    });

    const stockBeforeH = (await Product.findById(testProductA._id)).quantity;
    const cancelUnpaidRes = await api(`/api/orders/${unpaidOnlineOrder._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const stockAfterH = (await Product.findById(testProductA._id)).quantity;
    const dbUnpaidCancelled = await Order.findById(unpaidOnlineOrder._id);

    assert(
      cancelUnpaidRes.status === 200 &&
      dbUnpaidCancelled?.status === "Cancelled" &&
      dbUnpaidCancelled?.inventoryDeducted === false &&
      stockAfterH === stockBeforeH,
      "H. Pending unpaid order cancellation does NOT restore stock when inventoryDeducted=false"
    );

    // ====================================================
    // I. Cancelled paid order restores stock if inventoryDeducted=true
    // J. Stock restored by exact quantity
    // K. Second cancellation does not restore stock again
    // ====================================================
    console.log("\n--- 3. Exactly-Once Inventory Restoration & Idempotency ---");

    const exactQtyOrder = await Order.create({
      userId: testCustomerA._id,
      vendorId: testVendorA._id,
      items: [{
        productId: testProductA._id.toString(),
        name: testProductA.name,
        quantity: 3,
        price: testProductA.price,
        weight: "500 g",
      }],
      deliveryAddress: validAddress,
      totalAmount: 600,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      status: "Processing",
      inventoryDeducted: true,
    });
    await Product.findByIdAndUpdate(testProductA._id, { $inc: { quantity: -3 } });

    const stockBeforeI = (await Product.findById(testProductA._id)).quantity;
    const cancelI = await api(`/api/orders/${exactQtyOrder._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const stockAfterI = (await Product.findById(testProductA._id)).quantity;

    assert(
      cancelI.status === 200 &&
      stockAfterI === stockBeforeI + 3,
      `I & J. Cancelled paid order restores stock by exact quantity (+3: ${stockBeforeI} -> ${stockAfterI})`
    );

    // Second cancellation call
    const cancelK = await api(`/api/orders/${exactQtyOrder._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const stockAfterK = (await Product.findById(testProductA._id)).quantity;

    assert(
      cancelK.status === 400 &&
      stockAfterK === stockAfterI,
      `K. Second cancellation does not restore stock again (Stock remains ${stockAfterK})`
    );

    // ====================================================
    // L. Concurrent duplicate cancellation cannot double-restore stock
    // ====================================================
    console.log("\n--- 4. Concurrency Protection Against Double-Restoration ---");

    const concurrentOrder = await Order.create({
      userId: testCustomerA._id,
      vendorId: testVendorA._id,
      items: [{
        productId: testProductA._id.toString(),
        name: testProductA.name,
        quantity: 5,
        price: testProductA.price,
        weight: "500 g",
      }],
      deliveryAddress: validAddress,
      totalAmount: 1000,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      status: "Placed",
      inventoryDeducted: true,
    });
    await Product.findByIdAndUpdate(testProductA._id, { $inc: { quantity: -5 } });

    const stockBeforeL = (await Product.findById(testProductA._id)).quantity;

    // Fire 5 concurrent cancellation requests simultaneously
    const concurrentCancels = [
      api(`/api/orders/${concurrentOrder._id}/cancel`, { method: "PUT", headers: { Authorization: `Bearer ${tokenA}` } }),
      api(`/api/orders/${concurrentOrder._id}/cancel`, { method: "PUT", headers: { Authorization: `Bearer ${tokenA}` } }),
      api(`/api/orders/${concurrentOrder._id}/cancel`, { method: "PUT", headers: { Authorization: `Bearer ${tokenA}` } }),
      api(`/api/orders/${concurrentOrder._id}/cancel`, { method: "PUT", headers: { Authorization: `Bearer ${tokenA}` } }),
      api(`/api/orders/${concurrentOrder._id}/cancel`, { method: "PUT", headers: { Authorization: `Bearer ${tokenA}` } }),
    ];

    const resultsL = await Promise.all(concurrentCancels);
    const stockAfterL = (await Product.findById(testProductA._id)).quantity;
    const successCount = resultsL.filter(r => r.status === 200).length;

    assert(
      successCount === 1 &&
      stockAfterL === stockBeforeL + 5,
      `L. 5 concurrent cancellations resulted in exactly 1 success and stock restored exactly once (+5: ${stockBeforeL} -> ${stockAfterL})`
    );

    // ====================================================
    // M. Vendor can cancel only their own vendor order
    // N. Vendor cannot cancel another vendor's order
    // ====================================================
    console.log("\n--- 5. Vendor & Admin Cancellation Isolation ---");

    const vendorOrderA = await Order.create({
      userId: testCustomerA._id,
      vendorId: testVendorA._id,
      items: [{
        productId: testProductA._id.toString(),
        name: testProductA.name,
        quantity: 2,
        price: testProductA.price,
        weight: "500 g",
      }],
      deliveryAddress: validAddress,
      totalAmount: 400,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      status: "Processing",
      inventoryDeducted: true,
    });
    await Product.findByIdAndUpdate(testProductA._id, { $inc: { quantity: -2 } });

    // Vendor B attempts to cancel Vendor A's order
    const vendorBCancelRes = await api(`/api/vendor/orders/${vendorOrderA._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorB}` },
      body: JSON.stringify({ status: "Cancelled" }),
    });
    assert(
      vendorBCancelRes.status === 404,
      "N. Vendor B cannot cancel Vendor A's order (HTTP 404 Access Denied)"
    );

    // Vendor A cancels their own order
    const stockBeforeM = (await Product.findById(testProductA._id)).quantity;
    const vendorACancelRes = await api(`/api/vendor/orders/${vendorOrderA._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenVendorA}` },
      body: JSON.stringify({ status: "Cancelled" }),
    });
    const stockAfterM = (await Product.findById(testProductA._id)).quantity;
    const dbVendorOrderA = await Order.findById(vendorOrderA._id);

    assert(
      vendorACancelRes.status === 200 &&
      dbVendorOrderA?.status === "Cancelled" &&
      stockAfterM === stockBeforeM + 2,
      "M. Vendor A can cancel own order and stock is restored once"
    );

    // ====================================================
    // O. Admin cancellation works
    // ====================================================
    const adminOrder = await Order.create({
      userId: testCustomerA._id,
      vendorId: testVendorA._id,
      items: [{
        productId: testProductA._id.toString(),
        name: testProductA.name,
        quantity: 3,
        price: testProductA.price,
        weight: "500 g",
      }],
      deliveryAddress: validAddress,
      totalAmount: 600,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      status: "Accepted",
      inventoryDeducted: true,
    });
    await Product.findByIdAndUpdate(testProductA._id, { $inc: { quantity: -3 } });

    const stockBeforeO = (await Product.findById(testProductA._id)).quantity;
    const adminCancelRes = await api(`/api/admin/orders/${adminOrder._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: "Cancelled" }),
    });
    const stockAfterO = (await Product.findById(testProductA._id)).quantity;
    const dbAdminOrder = await Order.findById(adminOrder._id);

    assert(
      adminCancelRes.status === 200 &&
      dbAdminOrder?.status === "Cancelled" &&
      stockAfterO === stockBeforeO + 3,
      "O. Admin cancellation works and restores stock"
    );

    // ====================================================
    // P. Multi-vendor cancellation restores only the affected vendor/order inventory
    // ====================================================
    console.log("\n--- 6. Multi-Vendor Sub-Order Cancellation Independence ---");

    const commonRzpOrderId = `rzp_multi_${Date.now()}`;
    const mvOrderA = await Order.create({
      userId: testCustomerA._id,
      vendorId: testVendorA._id,
      items: [{
        productId: testProductA._id.toString(),
        name: testProductA.name,
        quantity: 2,
        price: 200,
        weight: "500 g",
      }],
      deliveryAddress: validAddress,
      totalAmount: 400,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      status: "Placed",
      razorpayOrderId: commonRzpOrderId,
      inventoryDeducted: true,
    });
    await Product.findByIdAndUpdate(testProductA._id, { $inc: { quantity: -2 } });

    const mvOrderB = await Order.create({
      userId: testCustomerA._id,
      vendorId: testVendorB._id,
      items: [{
        productId: testProductB._id.toString(),
        name: testProductB.name,
        quantity: 3,
        price: 250,
        weight: "250 g",
      }],
      deliveryAddress: validAddress,
      totalAmount: 750,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      status: "Placed",
      razorpayOrderId: commonRzpOrderId,
      inventoryDeducted: true,
    });
    await Product.findByIdAndUpdate(testProductB._id, { $inc: { quantity: -3 } });

    const stockProdA_beforeP = (await Product.findById(testProductA._id)).quantity;
    const stockProdB_beforeP = (await Product.findById(testProductB._id)).quantity;

    // Customer cancels only Vendor A's sub-order
    const cancelMvResA = await api(`/api/orders/${mvOrderA._id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const stockProdA_afterP = (await Product.findById(testProductA._id)).quantity;
    const stockProdB_afterP = (await Product.findById(testProductB._id)).quantity;
    const dbMvOrderA = await Order.findById(mvOrderA._id);
    const dbMvOrderB = await Order.findById(mvOrderB._id);

    assert(
      cancelMvResA.status === 200 &&
      dbMvOrderA?.status === "Cancelled" &&
      dbMvOrderB?.status === "Placed" &&
      stockProdA_afterP === stockProdA_beforeP + 2 &&
      stockProdB_afterP === stockProdB_beforeP,
      "P. Multi-vendor cancellation restores only Vendor A's inventory (+2); Vendor B's inventory is untouched and order remains Placed"
    );

    // ====================================================
    // Q. Product stock remains correct after cancellation
    // ====================================================
    console.log("\n--- 7. Final Stock Correctness ---");

    const finalStockA = (await Product.findById(testProductA._id)).quantity;
    assert(
      finalStockA === initialStockProdA - 1,
      `Q. Product A final stock matches expected balance after delivered order (${finalStockA} === ${initialStockProdA - 1})`
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
  console.log("PHASE 4.3 TEST SUMMARY");
  console.log("==================================================");
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log("ALL PHASE 4.3 TESTS PASSED!\n");
  } else {
    console.error("SOME PHASE 4.3 TESTS FAILED!\n");
    process.exit(1);
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal test error:", err);
    process.exit(1);
  });
