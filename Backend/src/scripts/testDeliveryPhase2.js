const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../app");
const User = require("../models/user.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");

let server;
let baseUrl;

const createdUserIds = [];
const createdOrderIds = [];
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

async function run() {
  console.log("=========================================");
  console.log("DELIVERY PHASE 2 TEST SUITE");
  console.log("=========================================\n");

  const connectDB = require("../db/db");
  await connectDB();
  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 200));
  }

  // Start HTTP server on random free port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  try {
    // ------------------------------------------------------------------------
    // SETUP FIXTURES: Admin, Vendor, Customer, Delivery Partners
    // ------------------------------------------------------------------------
    const rand = Math.floor(10000000 + Math.random() * 90000000);

    // 1. Admin
    const adminUser = await User.create({
      name: "Admin Delivery Tester",
      phone: `99${rand}`,
      role: "admin",
    });
    createdUserIds.push(adminUser._id);
    const adminToken = jwt.sign({ id: adminUser._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // 2. Vendor with Store
    const vendorUser = await User.create({
      name: "Organic Farmer Ravi",
      phone: `98${rand}`,
      role: "vendor",
      shopStatus: "approved",
      storeName: "Ravi Organic Farm",
      storeAddress: "Plot 12, Green Valley Farms, Pune",
      coordinates: { lat: 18.5204, lng: 73.8567 },
    });
    createdUserIds.push(vendorUser._id);
    const vendorToken = jwt.sign({ id: vendorUser._id, role: "vendor" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // 3. Customer
    const customerUser = await User.create({
      name: "Pooja Sharma",
      phone: `97${rand}`,
      role: "user",
    });
    createdUserIds.push(customerUser._id);
    const customerToken = jwt.sign({ id: customerUser._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // 4. Delivery Partner A (Approved)
    const partnerA = await User.create({
      name: "Rider Amit",
      phone: `96${rand}`,
      role: "delivery",
      deliveryStatus: "approved",
      isAvailable: false,
      vehicleDetails: { vehicleType: "Bike", vehicleNumber: "MH12AB1001" },
    });
    createdUserIds.push(partnerA._id);
    const partnerAToken = jwt.sign({ id: partnerA._id, role: "delivery" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // 5. Delivery Partner B (Approved - for concurrency & IDOR)
    const partnerB = await User.create({
      name: "Rider Bhuvan",
      phone: `95${rand}`,
      role: "delivery",
      deliveryStatus: "approved",
      isAvailable: true,
      vehicleDetails: { vehicleType: "Electric Vehicle", vehicleNumber: "MH12EV2002" },
    });
    createdUserIds.push(partnerB._id);
    const partnerBToken = jwt.sign({ id: partnerB._id, role: "delivery" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // 6. Delivery Partner Pending
    const partnerPending = await User.create({
      name: "Rider Pending",
      phone: `94${rand}`,
      role: "delivery",
      deliveryStatus: "pending",
      isAvailable: false,
    });
    createdUserIds.push(partnerPending._id);
    const pendingToken = jwt.sign({ id: partnerPending._id, role: "delivery" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // 7. Delivery Partner Rejected
    const partnerRejected = await User.create({
      name: "Rider Rejected",
      phone: `93${rand}`,
      role: "delivery",
      deliveryStatus: "rejected",
      isAvailable: false,
    });
    createdUserIds.push(partnerRejected._id);
    const rejectedToken = jwt.sign({ id: partnerRejected._id, role: "delivery" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // 8. Delivery Partner Suspended
    const partnerSuspended = await User.create({
      name: "Rider Suspended",
      phone: `92${rand}`,
      role: "delivery",
      deliveryStatus: "suspended",
      isAvailable: false,
    });
    createdUserIds.push(partnerSuspended._id);
    const suspendedToken = jwt.sign({ id: partnerSuspended._id, role: "delivery" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // ------------------------------------------------------------------------
    // 1 & 2. AVAILABILITY: Approved Partner Can Go Online / Offline
    // ------------------------------------------------------------------------
    console.log("\n--- 1 & 2. Online / Offline Availability Toggle ---");
    const onlineRes = await api("/api/delivery/availability", {
      method: "PUT",
      headers: { Authorization: `Bearer ${partnerAToken}` },
      body: JSON.stringify({ isAvailable: true }),
    });
    assert(onlineRes.status === 200, "Approved partner can go online (HTTP 200)");
    assert(onlineRes.data?.isAvailable === true, "Response returns isAvailable: true");
    const dbPartnerAOnline = await User.findById(partnerA._id);
    assert(dbPartnerAOnline.isAvailable === true, "Database confirms isAvailable is true");

    const offlineRes = await api("/api/delivery/availability", {
      method: "PUT",
      headers: { Authorization: `Bearer ${partnerAToken}` },
      body: JSON.stringify({ isAvailable: false }),
    });
    assert(offlineRes.status === 200, "Approved partner can go offline (HTTP 200)");
    assert(offlineRes.data?.isAvailable === false, "Response returns isAvailable: false");
    const dbPartnerAOffline = await User.findById(partnerA._id);
    assert(dbPartnerAOffline.isAvailable === false, "Database confirms isAvailable is false");

    // Invalid payload
    const badAvailRes = await api("/api/delivery/availability", {
      method: "PUT",
      headers: { Authorization: `Bearer ${partnerAToken}` },
      body: JSON.stringify({ isAvailable: "not-a-boolean" }),
    });
    assert(badAvailRes.status === 400, "Non-boolean isAvailable rejected with HTTP 400");

    // ------------------------------------------------------------------------
    // 3, 4, 5. UNAUTHORIZED AVAILABILITY: Pending, Rejected, Suspended Blocked
    // ------------------------------------------------------------------------
    console.log("\n--- 3, 4, 5. Non-Approved Partners Blocked from Going Online ---");
    const pendingAvail = await api("/api/delivery/availability", {
      method: "PUT",
      headers: { Authorization: `Bearer ${pendingToken}` },
      body: JSON.stringify({ isAvailable: true }),
    });
    assert(pendingAvail.status === 403, "Pending partner blocked from going online (HTTP 403)");

    const rejectedAvail = await api("/api/delivery/availability", {
      method: "PUT",
      headers: { Authorization: `Bearer ${rejectedToken}` },
      body: JSON.stringify({ isAvailable: true }),
    });
    assert(rejectedAvail.status === 403, "Rejected partner blocked from going online (HTTP 403)");

    const suspendedAvail = await api("/api/delivery/availability", {
      method: "PUT",
      headers: { Authorization: `Bearer ${suspendedToken}` },
      body: JSON.stringify({ isAvailable: true }),
    });
    assert(suspendedAvail.status === 403, "Suspended partner blocked from going online (HTTP 403)");

    // ------------------------------------------------------------------------
    // 6. OFFLINE PARTNER CANNOT ACCEPT ORDERS
    // ------------------------------------------------------------------------
    console.log("\n--- 6. Offline Partner Blocked from Accepting Orders ---");
    // Create an eligible test order
    const testOrder1 = await Order.create({
      userId: customerUser._id,
      vendorId: vendorUser._id,
      items: [{ productId: new mongoose.Types.ObjectId().toString(), name: "Organic Tomatoes", quantity: 2, price: 50 }],
      totalAmount: 140,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      status: "Processing",
      deliveryAddress: {
        name: "Pooja Sharma",
        phone: "9876543210",
        street: "B-402, Sunshine Apts",
        city: "Pune",
        pincode: "411001",
      },
    });
    createdOrderIds.push(testOrder1._id);

    // Create non-eligible status orders: Placed, Accepted, Packing
    const placedOrder = await Order.create({
      userId: customerUser._id,
      vendorId: vendorUser._id,
      items: [{ productId: new mongoose.Types.ObjectId().toString(), name: "Organic Carrots", quantity: 1, price: 40 }],
      totalAmount: 40,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      status: "Placed",
      deliveryAddress: { name: "Pooja Sharma", phone: "9876543210", street: "MG Road", city: "Pune", pincode: "411001" },
    });
    createdOrderIds.push(placedOrder._id);

    const acceptedOrder = await Order.create({
      userId: customerUser._id,
      vendorId: vendorUser._id,
      items: [{ productId: new mongoose.Types.ObjectId().toString(), name: "Organic Spinach", quantity: 1, price: 30 }],
      totalAmount: 30,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      status: "Accepted",
      deliveryAddress: { name: "Pooja Sharma", phone: "9876543210", street: "MG Road", city: "Pune", pincode: "411001" },
    });
    createdOrderIds.push(acceptedOrder._id);

    const packingOrder = await Order.create({
      userId: customerUser._id,
      vendorId: vendorUser._id,
      items: [{ productId: new mongoose.Types.ObjectId().toString(), name: "Organic Potatoes", quantity: 2, price: 25 }],
      totalAmount: 50,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      status: "Packing",
      deliveryAddress: { name: "Pooja Sharma", phone: "9876543210", street: "MG Road", city: "Pune", pincode: "411001" },
    });
    createdOrderIds.push(packingOrder._id);

    // Partner A is currently OFFLINE
    const offlineAcceptRes = await api(`/api/delivery/orders/${testOrder1._id}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${partnerAToken}` },
    });
    assert(offlineAcceptRes.status === 400, "Offline partner blocked from accepting order (HTTP 400)");
    assert(offlineAcceptRes.data?.message?.includes("online"), "Error specifies partner must be online");

    // ------------------------------------------------------------------------
    // 7. ONLINE APPROVED PARTNER CAN VIEW AVAILABLE ORDERS (Sanitized Preview)
    // ------------------------------------------------------------------------
    console.log("\n--- 7. Online Partner Views Available Orders (PII Protected) ---");
    // Switch Partner A back ONLINE
    await api("/api/delivery/availability", {
      method: "PUT",
      headers: { Authorization: `Bearer ${partnerAToken}` },
      body: JSON.stringify({ isAvailable: true }),
    });

    const availFeedRes = await api("/api/delivery/orders/available", {
      headers: { Authorization: `Bearer ${partnerAToken}` },
    });
    assert(availFeedRes.status === 200, "Online approved partner can view available orders (HTTP 200)");
    assert(Array.isArray(availFeedRes.data?.orders), "Response contains orders array");
    const foundOrder1 = availFeedRes.data?.orders?.find((o) => String(o._id) === String(testOrder1._id));
    assert(Boolean(foundOrder1), "Created Processing order is present in available feed");
    assert(foundOrder1?.vendor?.storeName === "Ravi Organic Farm", "Vendor storeName is exposed for pickup");
    assert(foundOrder1?.destinationArea?.city === "Pune", "Destination city is visible");
    // CRITICAL PII CHECK: Customer name, phone, full street address must NOT be in available feed
    assert(foundOrder1?.deliveryAddress === undefined, "Full deliveryAddress object is hidden before acceptance");
    assert(foundOrder1?.customerPhone === undefined, "Customer phone is hidden before acceptance");

    // STATUS ELIGIBILITY FEED CHECKS: Placed, Accepted, Packing must NOT appear in available feed
    const hasPlacedInFeed = availFeedRes.data?.orders?.some((o) => String(o._id) === String(placedOrder._id));
    assert(!hasPlacedInFeed, "Placed order does NOT appear in available feed");
    const hasAcceptedInFeed = availFeedRes.data?.orders?.some((o) => String(o._id) === String(acceptedOrder._id));
    assert(!hasAcceptedInFeed, "Accepted order does NOT appear in available feed");
    const hasPackingInFeed = availFeedRes.data?.orders?.some((o) => String(o._id) === String(packingOrder._id));
    assert(!hasPackingInFeed, "Packing order does NOT appear in available feed");

    // ------------------------------------------------------------------------
    // Status-Based Acceptance Rejection Tests
    // ------------------------------------------------------------------------
    console.log("\n--- Non-Ready Orders Blocked from Acceptance (Placed, Accepted, Packing) ---");
    const acceptPlacedRes = await api(`/api/delivery/orders/${placedOrder._id}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${partnerAToken}` },
    });
    assert(acceptPlacedRes.status === 400, "Placed order cannot be accepted (HTTP 400)");
    assert(acceptPlacedRes.data?.message?.includes("not eligible"), "Error message specifies Placed status is not eligible");

    const acceptAcceptedRes = await api(`/api/delivery/orders/${acceptedOrder._id}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${partnerAToken}` },
    });
    assert(acceptAcceptedRes.status === 400, "Accepted order cannot be accepted (HTTP 400)");
    assert(acceptAcceptedRes.data?.message?.includes("not eligible"), "Error message specifies Accepted status is not eligible");

    const acceptPackingRes = await api(`/api/delivery/orders/${packingOrder._id}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${partnerAToken}` },
    });
    assert(acceptPackingRes.status === 400, "Packing order cannot be accepted (HTTP 400)");
    assert(acceptPackingRes.data?.message?.includes("not eligible"), "Error message specifies Packing status is not eligible");

    // ------------------------------------------------------------------------
    // 8, 9, 10. NON-DELIVERY ROLES BLOCKED FROM AVAILABLE & ACCEPT APIS
    // ------------------------------------------------------------------------
    console.log("\n--- 8, 9, 10. Customer, Vendor, Admin Blocked from Delivery APIs ---");
    const custFeedRes = await api("/api/delivery/orders/available", {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custFeedRes.status === 403, "Customer blocked from available delivery orders (HTTP 403)");

    const vendorFeedRes = await api("/api/delivery/orders/available", {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    assert(vendorFeedRes.status === 403, "Vendor blocked from available delivery orders (HTTP 403)");

    const adminAcceptRes = await api(`/api/delivery/orders/${testOrder1._id}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminAcceptRes.status === 403, "Admin cannot accept as delivery partner (HTTP 403)");

    // ------------------------------------------------------------------------
    // 11, 12, 13. PARTNER A ACCEPTS ORDER (Feed Removal & Active Order)
    // ------------------------------------------------------------------------
    console.log("\n--- 11, 12, 13. Order Acceptance, Feed Removal & Active Delivery ---");
    const acceptRes = await api(`/api/delivery/orders/${testOrder1._id}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${partnerAToken}` },
    });
    assert(acceptRes.status === 200, "Partner A accepts eligible order (HTTP 200)");
    assert(acceptRes.data?.order?.deliveryPartnerId === String(partnerA._id), "Order returned has Partner A deliveryPartnerId");

    // Check database
    const dbOrder1 = await Order.findById(testOrder1._id);
    assert(String(dbOrder1.deliveryPartnerId) === String(partnerA._id), "Database confirms deliveryPartnerId assigned to Partner A");

    // Disappears from available feed for Partner B
    const feedAfterAccept = await api("/api/delivery/orders/available", {
      headers: { Authorization: `Bearer ${partnerBToken}` },
    });
    const stillInFeed = feedAfterAccept.data?.orders?.some((o) => String(o._id) === String(testOrder1._id));
    assert(!stillInFeed, "Accepted order disappears from available feed for other partners");

    // Appears in Partner A's active delivery
    const activeResA = await api("/api/delivery/orders/active", {
      headers: { Authorization: `Bearer ${partnerAToken}` },
    });
    assert(activeResA.status === 200, "Partner A can fetch active delivery (HTTP 200)");
    assert(activeResA.data?.hasActiveDelivery === true, "Response indicates active delivery exists");
    assert(String(activeResA.data?.order?._id) === String(testOrder1._id), "Active delivery matches accepted order");
    // Customer operational details now visible to assigned partner
    assert(activeResA.data?.order?.deliveryAddress?.name === "Pooja Sharma", "Assigned partner can see customer recipient name");
    assert(activeResA.data?.order?.deliveryAddress?.phone === "9876543210", "Assigned partner can see customer phone");
    assert(activeResA.data?.order?.deliveryAddress?.street === "B-402, Sunshine Apts", "Assigned partner can see full street address");

    // ------------------------------------------------------------------------
    // 14 & 15. ISOLATION: Partner B Cannot Access or Accept Assigned Order
    // ------------------------------------------------------------------------
    console.log("\n--- 14 & 15. Delivery Isolation & Duplicate Acceptance Blocked ---");
    // Partner B active delivery is empty
    const activeResB = await api("/api/delivery/orders/active", {
      headers: { Authorization: `Bearer ${partnerBToken}` },
    });
    assert(activeResB.data?.hasActiveDelivery === false, "Partner B has no active delivery");
    assert(activeResB.data?.order === null, "Partner B active order is null");

    // Partner B cannot access order details of Partner A's assigned delivery
    const detailResB = await api(`/api/delivery/orders/${testOrder1._id}`, {
      headers: { Authorization: `Bearer ${partnerBToken}` },
    });
    assert(detailResB.status === 403, "Partner B blocked from viewing Partner A's assigned order details (HTTP 403)");

    // Partner B attempts to accept already assigned order -> 409 Conflict
    const dupAcceptRes = await api(`/api/delivery/orders/${testOrder1._id}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${partnerBToken}` },
    });
    assert(dupAcceptRes.status === 409, "Second partner attempting acceptance receives HTTP 409 Conflict");
    assert(dupAcceptRes.data?.code === "ORDER_ALREADY_ACCEPTED", "Conflict code is ORDER_ALREADY_ACCEPTED");

    // ------------------------------------------------------------------------
    // 16 & 17. CONCURRENT ACCEPTANCE RACE CONDITION TEST
    // ------------------------------------------------------------------------
    console.log("\n--- 16 & 17. Atomic Concurrent Acceptance Race (Exactly 1 Winner) ---");
    const raceOrder = await Order.create({
      userId: customerUser._id,
      vendorId: vendorUser._id,
      items: [{ productId: new mongoose.Types.ObjectId().toString(), name: "Fresh Milk", quantity: 3, price: 30 }],
      totalAmount: 90,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      status: "Processing",
      deliveryAddress: { name: "Pooja Sharma", phone: "9876543210", street: "MG Road", city: "Pune", pincode: "411001" },
    });
    createdOrderIds.push(raceOrder._id);

    // Both Partner A and Partner B send PUT /accept simultaneously
    const [resultA, resultB] = await Promise.all([
      api(`/api/delivery/orders/${raceOrder._id}/accept`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${partnerAToken}` },
      }),
      api(`/api/delivery/orders/${raceOrder._id}/accept`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${partnerBToken}` },
      }),
    ]);

    const statuses = [resultA.status, resultB.status].sort();
    assert(statuses[0] === 200 && statuses[1] === 409, "Concurrent race results in exactly one 200 and one 409 Conflict", `Got: ${resultA.status}, ${resultB.status}`);

    const winnerId = resultA.status === 200 ? partnerA._id : partnerB._id;
    const dbRaceOrder = await Order.findById(raceOrder._id);
    assert(String(dbRaceOrder.deliveryPartnerId) === String(winnerId), "Database order assigned to the sole winner");

    // ------------------------------------------------------------------------
    // 18. DASHBOARD STATISTICS COME FROM BACKEND
    // ------------------------------------------------------------------------
    console.log("\n--- 18. Dashboard Statistics from Authoritative Database ---");
    const dashResA = await api("/api/delivery/dashboard", {
      headers: { Authorization: `Bearer ${partnerAToken}` },
    });
    assert(dashResA.status === 200, "Dashboard returns HTTP 200");
    assert(dashResA.data?.stats?.isAvailable === true, "Dashboard reflects online status");
    assert(typeof dashResA.data?.stats?.activeDeliveries === "number", "Active deliveries count is numeric");
    assert(dashResA.data?.stats?.partnerName === "Rider Amit", "Dashboard returns partner name");

    // ------------------------------------------------------------------------
    // 19. DELIVERY HISTORY ONLY CONTAINS PARTNER'S COMPLETED DELIVERIES
    // ------------------------------------------------------------------------
    console.log("\n--- 19. Delivery History Isolation ---");
    // Mark testOrder1 as Delivered
    await Order.findByIdAndUpdate(testOrder1._id, { $set: { status: "Delivered", updatedAt: new Date() } });

    const historyResA = await api("/api/delivery/orders/history", {
      headers: { Authorization: `Bearer ${partnerAToken}` },
    });
    assert(historyResA.status === 200, "Partner A can fetch delivery history (HTTP 200)");
    const historyOrder1 = historyResA.data?.orders?.find((o) => String(o._id) === String(testOrder1._id));
    assert(Boolean(historyOrder1), "Delivered order appears in Partner A's history");

    // Partner B's history must NOT contain Partner A's delivery
    const historyResB = await api("/api/delivery/orders/history", {
      headers: { Authorization: `Bearer ${partnerBToken}` },
    });
    const partnerBHasOrder1 = historyResB.data?.orders?.some((o) => String(o._id) === String(testOrder1._id));
    assert(!partnerBHasOrder1, "Partner B history does NOT contain Partner A's deliveries");

    // ------------------------------------------------------------------------
    // 20. SAFE ERROR HANDLING FOR INVALID IDS
    // ------------------------------------------------------------------------
    console.log("\n--- 20. Safe Error Handling for Invalid IDs ---");
    const badIdAccept = await api("/api/delivery/orders/invalid-mongo-id/accept", {
      method: "PUT",
      headers: { Authorization: `Bearer ${partnerAToken}` },
    });
    assert(badIdAccept.status === 400, "Malformed order ID on accept returns HTTP 400");

    const nonExistentAccept = await api(`/api/delivery/orders/${new mongoose.Types.ObjectId()}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${partnerAToken}` },
    });
    assert(nonExistentAccept.status === 404, "Non-existent order ID on accept returns HTTP 404");

    const badIdDetail = await api("/api/delivery/orders/not-an-id", {
      headers: { Authorization: `Bearer ${partnerAToken}` },
    });
    assert(badIdDetail.status === 400, "Malformed order ID on detail returns HTTP 400");

    // ------------------------------------------------------------------------
    // 21. GOING OFFLINE PRESERVES ACTIVE DELIVERY
    // ------------------------------------------------------------------------
    console.log("\n--- 21. Going Offline Does NOT Cancel or Abandon Active Delivery ---");
    // Create new active order for Partner B
    const activeOrderForB = await Order.create({
      userId: customerUser._id,
      vendorId: vendorUser._id,
      deliveryPartnerId: partnerB._id,
      items: [{ productId: new mongoose.Types.ObjectId().toString(), name: "Organic Honey", quantity: 1, price: 200 }],
      totalAmount: 200,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      status: "Processing",
      deliveryAddress: { name: "Pooja Sharma", phone: "9876543210", street: "MG Road", city: "Pune", pincode: "411001" },
    });
    createdOrderIds.push(activeOrderForB._id);

    // Partner B toggles OFFLINE
    await api("/api/delivery/availability", {
      method: "PUT",
      headers: { Authorization: `Bearer ${partnerBToken}` },
      body: JSON.stringify({ isAvailable: false }),
    });

    // Verify order is still assigned to Partner B in DB and active
    const checkDbOrderB = await Order.findById(activeOrderForB._id);
    assert(String(checkDbOrderB.deliveryPartnerId) === String(partnerB._id), "Active delivery still assigned to Partner B after going offline");
    assert(checkDbOrderB.status === "Processing", "Order status remains Processing (not cancelled)");

    // Partner B can still view active delivery while offline
    const offlineActiveCheck = await api("/api/delivery/orders/active", {
      headers: { Authorization: `Bearer ${partnerBToken}` },
    });
    assert(offlineActiveCheck.status === 200, "Offline partner can still view their active delivery");
    assert(String(offlineActiveCheck.data?.order?._id) === String(activeOrderForB._id), "Active delivery data returned while offline");

  } finally {
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
      await new Promise((r) => server.close(r));
    }
    await mongoose.disconnect();
  }

  console.log("\n==================================================");
  console.log("DELIVERY PHASE 2 TEST SUMMARY");
  console.log("==================================================");
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log("ALL PHASE 2 TESTS PASSED!\n");
  } else {
    console.error("SOME PHASE 2 TESTS FAILED!\n");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
