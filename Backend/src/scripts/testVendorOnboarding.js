const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../app");
const User = require("../models/user.model");
const Product = require("../models/product.model");

let server;
let baseUrl;

const createdUserIds = [];
const createdProductIds = [];
const createdPhones = [];

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
  console.log("VENDOR ONBOARDING & APPROVAL TEST SUITE");
  console.log("=========================================\n");

  // Ensure DB connected
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
    // ----------------------------------------------------
    // 1. VENDOR SIGNUP FLOW
    // ----------------------------------------------------
    console.log("\n--- 1. Vendor Signup Flow ---");
    const vendorPhone = `95${Math.floor(10000000 + Math.random() * 90000000)}`;
    const vendorEmail = `onboard_vendor_${Date.now()}@example.com`;
    const vendorPass = "VendorPass123!";
    createdPhones.push(vendorPhone);

    const signupRes = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Green Valley Farm",
        phone: vendorPhone,
        email: vendorEmail,
        password: vendorPass,
        role: "vendor",
      }),
    });

    assert(signupRes.status === 201, "Vendor signup returns HTTP 201 Created");
    assert(signupRes.data?.user?.role === "vendor", "Registered user role is 'vendor'");
    assert(signupRes.data?.user?.shopStatus === "pending", "Registered vendor shopStatus is initialized to 'pending'");
    assert(!!signupRes.data?.token, "Vendor signup returns authentication JWT token");

    const vendorId = signupRes.data?.user?._id;
    if (vendorId) createdUserIds.push(vendorId);
    const vendorToken = signupRes.data?.token;

    // Verify DB state
    const dbVendor = await User.findById(vendorId);
    assert(dbVendor && dbVendor.role === "vendor" && dbVendor.shopStatus === "pending", "Database record confirms role='vendor' and shopStatus='pending'");

    // ----------------------------------------------------
    // 2. PENDING VENDOR ONBOARDING / PROFILE COMPLETION
    // ----------------------------------------------------
    console.log("\n--- 2. Pending Vendor Store Profile & Onboarding ---");

    // Pending vendor can read profile
    const getProfileRes = await api("/api/vendor/profile", {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    assert(getProfileRes.status === 200, "Pending vendor can fetch their profile (HTTP 200)");
    assert(getProfileRes.data?.role === "vendor", "Profile data reflects role='vendor'");
    assert(getProfileRes.data?.shopStatus === "pending", "Profile data reflects shopStatus='pending'");

    // Pending vendor updates store information (storeName, specialty, storeAddress, coordinates, storeImage)
    const updateProfileRes = await api("/api/vendor/profile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({
        storeName: "Green Valley Organic Farm",
        specialty: "Fresh Organic Vegetables & Herbs",
        storeAddress: "Plot 42, Farm Road, Pune, Maharashtra",
        coordinates: { lat: 18.5204, lng: 73.8567 },
        storeImage: "https://example.com/green_valley.jpg",
      }),
    });

    assert(updateProfileRes.status === 200, "Pending vendor can update store information (HTTP 200)");
    assert(updateProfileRes.data?.storeName === "Green Valley Organic Farm", "Updated storeName returned in response");
    assert(updateProfileRes.data?.specialty === "Fresh Organic Vegetables & Herbs", "Updated specialty returned in response");
    assert(updateProfileRes.data?.storeAddress === "Plot 42, Farm Road, Pune, Maharashtra", "Updated storeAddress returned in response");
    assert(updateProfileRes.data?.isProfileComplete === true, "isProfileComplete marked true after updating details");

    // Verify persistence in DB
    const dbUpdatedVendor = await User.findById(vendorId);
    assert(
      dbUpdatedVendor.storeName === "Green Valley Organic Farm" &&
      dbUpdatedVendor.storeAddress === "Plot 42, Farm Road, Pune, Maharashtra" &&
      dbUpdatedVendor.shopStatus === "pending",
      "Store details persisted in DB while shopStatus remains 'pending'"
    );

    // ----------------------------------------------------
    // 3. TAMPERING PREVENTION (SELF-APPROVAL BLOCKED)
    // ----------------------------------------------------
    console.log("\n--- 3. Tampering Prevention & Security ---");

    // Vendor attempts to self-approve via PUT /api/vendor/profile
    const hackProfileRes = await api("/api/vendor/profile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({
        storeName: "Green Valley Organic Farm",
        shopStatus: "approved",
      }),
    });
    const refreshedVendorAfterHack = await User.findById(vendorId);
    assert(
      refreshedVendorAfterHack.shopStatus === "pending",
      "Vendor cannot self-approve via profile update endpoint (shopStatus remains 'pending')"
    );

    // Customer cannot access vendor profile
    const customerPhone = `95${Math.floor(10000000 + Math.random() * 90000000)}`;
    const custRes = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Normal Customer",
        phone: customerPhone,
        password: "CustomerPass123!",
      }),
    });
    const customerToken = custRes.data?.token;
    if (custRes.data?.user?._id) createdUserIds.push(custRes.data.user._id);

    const custVendorProfileRes = await api("/api/vendor/profile", {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custVendorProfileRes.status === 403, "Normal customer cannot access vendor profile endpoint (HTTP 403)");

    // ----------------------------------------------------
    // 4. PENDING VENDOR RESTRICTIONS (APPROVED-ONLY ACTIONS BLOCKED)
    // ----------------------------------------------------
    console.log("\n--- 4. Pending Vendor Restrictions ---");

    // Cannot access vendor products
    const pendingProductsRes = await api("/api/vendor/products", {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    assert(pendingProductsRes.status === 403, "Pending vendor blocked from listing vendor products (HTTP 403)");

    // Cannot publish products
    const pendingAddProductRes = await api("/api/vendor/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({
        name: "Unauthorized Spinach",
        category: "Vegetables",
        price: 30,
        quantity: 10,
        unit: "1 bunch",
        image: "https://example.com/spinach.jpg",
      }),
    });
    assert(pendingAddProductRes.status === 403, "Pending vendor blocked from creating/publishing products (HTTP 403)");
    // Cannot view vendor orders
    const pendingOrdersRes = await api("/api/vendor/orders", {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    assert(pendingOrdersRes.status === 403, "Pending vendor blocked from vendor orders (HTTP 403)");

    // Pending vendor is not publicly exposed
    const publicVendorRes = await api(`/api/vendor/${vendorId}/info`);
    assert(publicVendorRes.status === 404, "Pending vendor is not publicly accessible via public vendor API (HTTP 404)");

    // ----------------------------------------------------
    // 5. ADMIN APPROVAL FLOW
    // ----------------------------------------------------
    console.log("\n--- 5. Admin Review and Approval Flow ---");

    // Create admin user & token
    const adminUser = await User.create({
      name: "Platform Admin",
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "admin",
    });
    createdUserIds.push(adminUser._id);
    const adminToken = jwt.sign({ id: adminUser._id, role: "admin" }, process.env.JWT_SECRET);

    // Admin approves vendor
    const approveRes = await api(`/api/admin/users/${vendorId}/shop-status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ shopStatus: "approved" }),
    });
    assert(approveRes.status === 200, "Admin can approve vendor shopStatus (HTTP 200)");
    assert(approveRes.data?.shopStatus === "approved", "Admin response returns shopStatus='approved'");

    const approvedDbVendor = await User.findById(vendorId);
    assert(approvedDbVendor.shopStatus === "approved", "Database confirms vendor is now approved");

    // ----------------------------------------------------
    // 6. APPROVED VENDOR FUNCTIONALITY
    // ----------------------------------------------------
    console.log("\n--- 6. Approved Vendor Functionality ---");

    // Approved vendor can access products
    const approvedProductsRes = await api("/api/vendor/products", {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    assert(approvedProductsRes.status === 200, "Approved vendor can access vendor products (HTTP 200)");

    // Approved vendor can publish products
    const addProductRes = await api("/api/vendor/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({
        name: "Green Valley Organic Carrots",
        category: "Vegetables",
        price: 60,
        quantity: 100,
        unit: "1 kg",
        image: "https://example.com/carrots.jpg",
        description: "Fresh farm-harvested organic carrots",
      }),
    });
    assert(addProductRes.status === 201, "Approved vendor can publish products (HTTP 201)");
    if (addProductRes.data?._id) createdProductIds.push(addProductRes.data._id);

    // Approved vendor is publicly visible
    const approvedPublicRes = await api(`/api/vendor/${vendorId}/info`);
    assert(approvedPublicRes.status === 200, "Approved vendor is publicly visible via public vendor API (HTTP 200)");
    assert(approvedPublicRes.data?.storeName === "Green Valley Organic Farm", "Public vendor API returns store details");

    // ----------------------------------------------------
    // 7. ADMIN REJECTION FLOW
    // ----------------------------------------------------
    console.log("\n--- 7. Admin Rejection Flow ---");

    const rejectRes = await api(`/api/admin/users/${vendorId}/shop-status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ shopStatus: "rejected" }),
    });
    assert(rejectRes.status === 200, "Admin can reject vendor (HTTP 200)");
    const rejectedDbVendor = await User.findById(vendorId);
    assert(rejectedDbVendor.role === "vendor", "Rejected vendor remains role='vendor' (NOT converted to customer)");
    assert(rejectedDbVendor.shopStatus === "rejected", "Rejected vendor shopStatus is 'rejected'");

    // Blocked from product management
    const rejectedProductAccess = await api("/api/vendor/products", {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    assert(rejectedProductAccess.status === 403, "Rejected vendor blocked from vendor products (HTTP 403)");

    // Profile remains accessible so rejected vendor can view status/update details
    const rejectedProfileAccess = await api("/api/vendor/profile", {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    assert(rejectedProfileAccess.status === 200, "Rejected vendor can access profile to see status (HTTP 200)");

    // ----------------------------------------------------
    // 8. ADMIN SUSPENSION FLOW
    // ----------------------------------------------------
    console.log("\n--- 8. Admin Suspension Flow ---");

    const suspendRes = await api(`/api/admin/users/${vendorId}/shop-status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ shopStatus: "suspended" }),
    });
    assert(suspendRes.status === 200, "Admin can suspend vendor (HTTP 200)");

    const suspendedDbVendor = await User.findById(vendorId);
    assert(suspendedDbVendor.role === "vendor", "Suspended vendor remains role='vendor'");
    assert(suspendedDbVendor.shopStatus === "suspended", "Suspended vendor shopStatus is 'suspended'");

    // Blocked from product management
    const suspendedProductAccess = await api("/api/vendor/products", {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    assert(suspendedProductAccess.status === 403, "Suspended vendor blocked from vendor products (HTTP 403)");

    // ----------------------------------------------------
    // 9. CLEANUP
    // ----------------------------------------------------
    console.log("\n--- Cleaning Up Test Fixtures ---");
    await User.deleteMany({ _id: { $in: createdUserIds } });
    await Product.deleteMany({ _id: { $in: createdProductIds } });
    console.log("Cleaned up test users and products.");

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log("\n=========================================");
  console.log("VENDOR ONBOARDING TEST SUMMARY");
  console.log("=========================================");
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log("ALL VENDOR ONBOARDING TESTS PASSED!\n");
  } else {
    console.error("SOME TESTS FAILED!\n");
    process.exit(1);
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal test error:", err);
    process.exit(1);
  });
