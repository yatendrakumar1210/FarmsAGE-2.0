const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const connectDB = require("../db/db");

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

// Helper to recursively collect all stages and indexNames in an explain winning plan
function inspectPlan(stage, collected = { stages: [], indexNames: [] }) {
  if (!stage) return collected;
  if (stage.stage) collected.stages.push(stage.stage);
  if (stage.indexName) collected.indexNames.push(stage.indexName);

  if (stage.inputStage) {
    inspectPlan(stage.inputStage, collected);
  }
  if (Array.isArray(stage.inputStages)) {
    for (const sub of stage.inputStages) {
      inspectPlan(sub, collected);
    }
  }
  return collected;
}

async function run() {
  console.log("==================================================");
  console.log("PHASE 4.5 DATABASE INDEXES & PERFORMANCE TESTS");
  console.log("==================================================\n");

  await connectDB();
  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 200));
  }

  const createdUserIds = [];
  const createdProductIds = [];
  const createdOrderIds = [];

  try {
    // ----------------------------------------------------
    // 1. SAFELY CREATE / ENSURE INDEXES ON MONGODB
    // ----------------------------------------------------
    console.log("--- 1. Ensuring Schema Indexes in MongoDB ---");
    // Model.createIndexes() safely creates declared indexes without dropping existing ones
    await Order.createIndexes();
    await Product.createIndexes();
    await User.createIndexes();
    console.log("createIndexes() completed successfully for Order, Product, User.\n");

    // ----------------------------------------------------
    // 2. INSPECT ACTUAL COLLECTION INDEXES IN MONGODB
    // ----------------------------------------------------
    console.log("--- 2. Inspecting Actual MongoDB Collection Indexes ---");

    const orderIndexes = await Order.collection.listIndexes().toArray();
    const productIndexes = await Product.collection.listIndexes().toArray();
    const userIndexes = await User.collection.listIndexes().toArray();

    const orderIndexNames = orderIndexes.map((idx) => idx.name);
    const productIndexNames = productIndexes.map((idx) => idx.name);
    const userIndexNames = userIndexes.map((idx) => idx.name);

    console.log("Order collection indexes:", orderIndexNames);
    console.log("Product collection indexes:", productIndexNames);
    console.log("User collection indexes:", userIndexNames);
    console.log("");

    // A. Verify Order new indexes
    assert(
      orderIndexNames.includes("userId_1_createdAt_-1"),
      "A. Order index 'userId_1_createdAt_-1' exists in MongoDB",
      `Actual: ${JSON.stringify(orderIndexNames)}`
    );

    assert(
      orderIndexNames.includes("vendorId_1_createdAt_-1"),
      "B. Order index 'vendorId_1_createdAt_-1' exists in MongoDB",
      `Actual: ${JSON.stringify(orderIndexNames)}`
    );

    assert(
      orderIndexNames.includes("createdAt_-1"),
      "C. Order index 'createdAt_-1' exists in MongoDB",
      `Actual: ${JSON.stringify(orderIndexNames)}`
    );

    // B. Verify Product new index
    assert(
      productIndexNames.includes("vendorId_1_createdAt_-1"),
      "D. Product index 'vendorId_1_createdAt_-1' exists in MongoDB",
      `Actual: ${JSON.stringify(productIndexNames)}`
    );

    // C. Verify User new index
    assert(
      userIndexNames.includes("role_1_shopStatus_1"),
      "E. User index 'role_1_shopStatus_1' exists in MongoDB",
      `Actual: ${JSON.stringify(userIndexNames)}`
    );

    // D. Verify Existing Preserved Indexes
    assert(
      orderIndexNames.includes("paymentId_1") &&
      orderIndexNames.includes("razorpayOrderId_1") &&
      orderIndexNames.includes("refundId_1"),
      "F. Existing Order payment and refund indexes preserved"
    );

    assert(
      productIndexNames.includes("quantity_-1_createdAt_-1") &&
      productIndexNames.includes("quantity_-1_price_1") &&
      productIndexNames.includes("quantity_-1_price_-1"),
      "G. Existing Product public catalog compound indexes preserved"
    );

    assert(
      userIndexNames.includes("phone_1") && userIndexNames.includes("email_1"),
      "H. Existing User unique sparse phone and email indexes preserved"
    );

    // ----------------------------------------------------
    // 3. EXPLAIN EXECUTION STATS & PLAN VERIFICATION
    // ----------------------------------------------------
    console.log("\n--- 3. Query Plan Verification via explain() ---");

    // Setup temporary test documents to ensure query planner has concrete targets
    const testCustomer = await User.create({
      name: "Phase45 Test Customer",
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `p45_cust_${Date.now()}@example.com`,
      role: "user",
    });
    createdUserIds.push(testCustomer._id);

    const testVendor = await User.create({
      name: "Phase45 Test Vendor",
      phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `p45_vend_${Date.now()}@example.com`,
      role: "vendor",
      shopStatus: "approved",
      coordinates: { lat: 12.9716, lng: 77.5946 },
    });
    createdUserIds.push(testVendor._id);

    const testProd = await Product.create({
      name: "Phase45 Fresh Mango",
      category: "Fruits",
      price: 120,
      quantity: 50,
      unit: "1 kg",
      image: "https://example.com/mango.jpg",
      vendorId: testVendor._id,
    });
    createdProductIds.push(testProd._id);

    const testOrder = await Order.create({
      userId: testCustomer._id,
      vendorId: testVendor._id,
      items: [{ productId: testProd._id.toString(), quantity: 2, price: 120, name: "Phase45 Fresh Mango" }],
      totalAmount: 240,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      status: "Placed",
      inventoryDeducted: true,
    });
    createdOrderIds.push(testOrder._id);

    // Q1: Order.find({ userId }).sort({ createdAt: -1 })
    const orderUserExplain = await Order.find({ userId: testCustomer._id })
      .sort({ createdAt: -1 })
      .explain("executionStats");

    const orderUserPlan = inspectPlan(orderUserExplain.queryPlanner?.winningPlan);
    const usesOrderUserIndex = orderUserPlan.indexNames.includes("userId_1_createdAt_-1");
    const hasOrderUserSortStage = orderUserPlan.stages.includes("SORT");

    console.log("  [Q1] Order find by userId sorted by createdAt desc:");
    console.log(`       Index used: ${orderUserPlan.indexNames.join(", ") || "none"}`);
    console.log(`       Stages: ${orderUserPlan.stages.join(" -> ")}`);

    assert(
      usesOrderUserIndex && !hasOrderUserSortStage,
      "I. Order query { userId, createdAt: -1 } uses 'userId_1_createdAt_-1' with zero in-memory sort",
      `Used index: ${orderUserPlan.indexNames}, Stages: ${orderUserPlan.stages}`
    );

    // Q2: Order.find({ vendorId }).sort({ createdAt: -1 })
    const orderVendorExplain = await Order.find({ vendorId: testVendor._id })
      .sort({ createdAt: -1 })
      .explain("executionStats");

    const orderVendorPlan = inspectPlan(orderVendorExplain.queryPlanner?.winningPlan);
    const usesOrderVendorIndex = orderVendorPlan.indexNames.includes("vendorId_1_createdAt_-1");
    const hasOrderVendorSortStage = orderVendorPlan.stages.includes("SORT");

    console.log("  [Q2] Order find by vendorId sorted by createdAt desc:");
    console.log(`       Index used: ${orderVendorPlan.indexNames.join(", ") || "none"}`);
    console.log(`       Stages: ${orderVendorPlan.stages.join(" -> ")}`);

    assert(
      usesOrderVendorIndex && !hasOrderVendorSortStage,
      "J. Order query { vendorId, createdAt: -1 } uses 'vendorId_1_createdAt_-1' with zero in-memory sort",
      `Used index: ${orderVendorPlan.indexNames}, Stages: ${orderVendorPlan.stages}`
    );

    // Q3: Order.find({}).sort({ createdAt: -1 }).limit(10) (Admin order listing)
    const adminOrderExplain = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .explain("executionStats");

    const adminOrderPlan = inspectPlan(adminOrderExplain.queryPlanner?.winningPlan);
    const usesCreatedAtSortIndex = adminOrderPlan.indexNames.includes("createdAt_-1");
    const hasAdminSortStage = adminOrderPlan.stages.includes("SORT");

    console.log("  [Q3] Admin Order list sorted by createdAt desc:");
    console.log(`       Index used: ${adminOrderPlan.indexNames.join(", ") || "none"}`);
    console.log(`       Stages: ${adminOrderPlan.stages.join(" -> ")}`);

    assert(
      usesCreatedAtSortIndex && !hasAdminSortStage,
      "K. Admin Order sort query uses 'createdAt_-1' with zero in-memory sort",
      `Used index: ${adminOrderPlan.indexNames}, Stages: ${adminOrderPlan.stages}`
    );

    // Q4: Product.find({ vendorId }).sort({ createdAt: -1 }) (Vendor product management)
    const prodVendorExplain = await Product.find({ vendorId: testVendor._id })
      .sort({ createdAt: -1 })
      .explain("executionStats");

    const prodVendorPlan = inspectPlan(prodVendorExplain.queryPlanner?.winningPlan);
    const usesProdVendorIndex = prodVendorPlan.indexNames.includes("vendorId_1_createdAt_-1");
    const hasProdVendorSortStage = prodVendorPlan.stages.includes("SORT");

    console.log("  [Q4] Product find by vendorId sorted by createdAt desc:");
    console.log(`       Index used: ${prodVendorPlan.indexNames.join(", ") || "none"}`);
    console.log(`       Stages: ${prodVendorPlan.stages.join(" -> ")}`);

    assert(
      usesProdVendorIndex && !hasProdVendorSortStage,
      "L. Product query { vendorId, createdAt: -1 } uses 'vendorId_1_createdAt_-1' with zero in-memory sort",
      `Used index: ${prodVendorPlan.indexNames}, Stages: ${prodVendorPlan.stages}`
    );

    // Q5: User.find({ role: "vendor", shopStatus: "approved" }) (Vendor discovery filter)
    const userVendorExplain = await User.find({ role: "vendor", shopStatus: "approved" })
      .explain("executionStats");

    const userVendorPlan = inspectPlan(userVendorExplain.queryPlanner?.winningPlan);
    const usesUserVendorIndex = userVendorPlan.indexNames.includes("role_1_shopStatus_1");
    const hasUserCollScan = userVendorPlan.stages.includes("COLLSCAN");

    console.log("  [Q5] User find by role and shopStatus:");
    console.log(`       Index used: ${userVendorPlan.indexNames.join(", ") || "none"}`);
    console.log(`       Stages: ${userVendorPlan.stages.join(" -> ")}`);

    assert(
      usesUserVendorIndex && !hasUserCollScan,
      "M. User query { role: 'vendor', shopStatus: 'approved' } uses 'role_1_shopStatus_1' with no COLLSCAN",
      `Used index: ${userVendorPlan.indexNames}, Stages: ${userVendorPlan.stages}`
    );

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log("\n--- Cleaning Up Test Fixtures ---");
    await User.deleteMany({ _id: { $in: createdUserIds } });
    await Product.deleteMany({ _id: { $in: createdProductIds } });
    await Order.deleteMany({ _id: { $in: createdOrderIds } });
    console.log("Cleaned up test fixtures.");

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await mongoose.disconnect();
  }

  console.log("\n==================================================");
  console.log("PHASE 4.5 TEST SUMMARY");
  console.log("==================================================");
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log("ALL PHASE 4.5 TESTS PASSED!\n");
  } else {
    console.error("SOME PHASE 4.5 TESTS FAILED!\n");
    process.exit(1);
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal test error:", err);
    process.exit(1);
  });
