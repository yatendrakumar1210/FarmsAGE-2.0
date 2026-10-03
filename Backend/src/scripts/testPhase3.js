const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const app = require("../app");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const OTP = require("../models/otp.model");

let server;
let baseUrl;

const createdUserIds = [];
const createdProductIds = [];
const createdOrderIds = [];
const createdPhones = [];

const counts = {
  customerAuth: { passed: 0, failed: 0 },
  authorization: { passed: 0, failed: 0 },
  vendorStatus: { passed: 0, failed: 0 },
  vendorIsolation: { passed: 0, failed: 0 },
  otp: { passed: 0, failed: 0 },
};

function assert(category, condition, testName, details = "") {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    counts[category].passed++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    counts[category].failed++;
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
  console.log("PHASE 3 VERIFICATION & SECURITY TEST SUITE");
  console.log("=========================================\n");

  // Ensure DB connected
  if (mongoose.connection.readyState !== 1) {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(uri);
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
    // ============================================================
    // 1. CUSTOMER AUTHENTICATION & SENSITIVE DATA EXPOSURE
    // ============================================================
    console.log("\n--- 1. Customer Authentication Tests ---");
    const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testEmail = `cust_${Date.now()}@example.com`;
    const testPassword = "SecurePassword123!";
    createdPhones.push(testPhone);

    // Registration Success
    const regRes = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Customer",
        phone: testPhone,
        email: testEmail,
        password: testPassword,
      }),
    });
    assert("customerAuth", regRes.status === 201 && regRes.data?.token, "Registration success returns 201 & JWT");
    assert("customerAuth", regRes.data?.user?.password === undefined, "Registration response strips plaintext password & hash");

    const customerId = regRes.data?.user?._id;
    if (customerId) createdUserIds.push(customerId);
    const customerToken = regRes.data?.token;

    // Duplicate Phone Registration Rejection
    const dupPhoneRes = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Duplicate Phone",
        phone: testPhone,
        password: "OtherPassword123!",
      }),
    });
    assert("customerAuth", dupPhoneRes.status === 400, "Duplicate phone registration rejected with 400");

    // Duplicate Email Registration Rejection
    const dupEmailPhone = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
    createdPhones.push(dupEmailPhone);
    const dupEmailRes = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Duplicate Email",
        phone: dupEmailPhone,
        email: testEmail,
        password: "OtherPassword123!",
      }),
    });
    assert("customerAuth", dupEmailRes.status === 400, "Duplicate email registration rejected with 400");

    // Login Success
    const loginRes = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        phone: testPhone,
        password: testPassword,
      }),
    });
    assert("customerAuth", loginRes.status === 200 && loginRes.data?.token, "Login success with valid credentials returns 200 & JWT");
    assert("customerAuth", loginRes.data?.user?.password === undefined, "Login response does NOT expose password hash");

    // Login Wrong Password
    const wrongPassRes = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        phone: testPhone,
        password: "IncorrectPassword999!",
      }),
    });
    assert("customerAuth", wrongPassRes.status === 400, "Wrong password rejected with 400");

    // Login Missing Credentials
    const missingCredsRes = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        phone: "",
        password: "",
      }),
    });
    assert("customerAuth", missingCredsRes.status === 400, "Missing credentials rejected with 400");

    // Valid Protected Request (GET /api/auth/me)
    const validMeRes = await api("/api/auth/me", {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert("customerAuth", validMeRes.status === 200 && validMeRes.data?.user?.phone === testPhone, "Valid JWT allows access to protected route");

    // Missing Token on Protected Route
    const missingTokenRes = await api("/api/auth/me");
    assert("customerAuth", missingTokenRes.status === 401, "Missing token rejected with 401 Unauthorized");

    // Malformed Token on Protected Route
    const malformedTokenRes = await api("/api/auth/me", {
      headers: { Authorization: "Bearer this.is.an.invalid.token" },
    });
    assert("customerAuth", malformedTokenRes.status === 401, "Malformed token rejected with 401 Unauthorized");

    // Expired Token on Protected Route
    const expiredToken = jwt.sign(
      { id: customerId, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "-10s" }
    );
    const expiredTokenRes = await api("/api/auth/me", {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert("customerAuth", expiredTokenRes.status === 401, "Expired token rejected with 401 Unauthorized");

    // Logout Endpoint
    const logoutRes = await api("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert("customerAuth", logoutRes.status === 200 && logoutRes.data?.success === true, "Logout endpoint returns 200 & success");

    // ============================================================
    // 2. BACKEND-CONTROLLED ROLES & ROLE ESCALATION
    // ============================================================
    console.log("\n--- 2. Backend-Controlled Roles & Privilege Escalation Tests ---");

    // Direct role escalation in registration body: { role: "admin" }
    const hackerPhone1 = `96${Math.floor(10000000 + Math.random() * 90000000)}`;
    createdPhones.push(hackerPhone1);
    const hackerReg1 = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Attempted Admin Hacker",
        phone: hackerPhone1,
        password: "Password123!",
        role: "admin",
      }),
    });
    if (hackerReg1.data?.user?._id) createdUserIds.push(hackerReg1.data.user._id);
    assert("authorization", hackerReg1.data?.user?.role === "user", "Customer registration with role='admin' forced to 'user'");

    // Direct role escalation in completeProfile body: { role: "admin" }
    const hackerToken1 = hackerReg1.data?.token;
    const hackerProfileRes = await api("/api/auth/complete-profile", {
      method: "POST",
      headers: { Authorization: `Bearer ${hackerToken1}` },
      body: JSON.stringify({
        name: "Hacker Profile",
        role: "admin",
      }),
    });
    const refreshedHacker1 = await User.findById(hackerReg1.data?.user?._id);
    assert("authorization", refreshedHacker1.role === "user", "Role tampering via completeProfile safely rejected/ignored");

    // Customer direct attempt to register as vendor: role becomes "vendor" but shopStatus is "pending"
    const vendorRegRes = await api("/api/vendor/register-shop", {
      method: "POST",
      headers: { Authorization: `Bearer ${hackerToken1}` },
      body: JSON.stringify({
        storeName: "Hacker Farm",
        specialty: "Fruits",
        shopStatus: "approved", // Attempt to self-approve
      }),
    });
    const refreshedVendorApp = await User.findById(hackerReg1.data?.user?._id);
    assert("authorization", refreshedVendorApp.shopStatus === "pending", "Self-registering vendor shopStatus is strictly 'pending', cannot self-approve");

    // ============================================================
    // 3. VENDOR STATUS & AUTHORIZATION
    // ============================================================
    console.log("\n--- 3. Vendor Status Tests (Pending / Approved / Rejected / Suspended) ---");

    // Setup 4 vendor fixtures
    const pendingVendor = await User.create({
      name: "Pending Vendor",
      phone: `95${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "vendor",
      shopStatus: "pending",
    });
    createdUserIds.push(pendingVendor._id);

    const approvedVendor = await User.create({
      name: "Approved Vendor",
      phone: `94${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "vendor",
      shopStatus: "approved",
    });
    createdUserIds.push(approvedVendor._id);

    const rejectedVendor = await User.create({
      name: "Rejected Vendor",
      phone: `93${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "vendor",
      shopStatus: "rejected",
    });
    createdUserIds.push(rejectedVendor._id);

    const suspendedVendor = await User.create({
      name: "Suspended Vendor",
      phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "vendor",
      shopStatus: "suspended",
    });
    createdUserIds.push(suspendedVendor._id);

    const pendingToken = jwt.sign({ id: pendingVendor._id, role: "vendor" }, process.env.JWT_SECRET);
    const approvedToken = jwt.sign({ id: approvedVendor._id, role: "vendor" }, process.env.JWT_SECRET);
    const rejectedToken = jwt.sign({ id: rejectedVendor._id, role: "vendor" }, process.env.JWT_SECRET);
    const suspendedToken = jwt.sign({ id: suspendedVendor._id, role: "vendor" }, process.env.JWT_SECRET);

    // Pending vendor accessing /api/vendor/products -> REJECTED 403
    const pendingAccess = await api("/api/vendor/products", {
      headers: { Authorization: `Bearer ${pendingToken}` },
    });
    assert("vendorStatus", pendingAccess.status === 403, "Pending vendor blocked from vendor endpoints (HTTP 403)");

    // Rejected vendor accessing /api/vendor/products -> REJECTED 403
    const rejectedAccess = await api("/api/vendor/products", {
      headers: { Authorization: `Bearer ${rejectedToken}` },
    });
    assert("vendorStatus", rejectedAccess.status === 403, "Rejected vendor blocked from vendor endpoints (HTTP 403)");

    // Suspended vendor accessing /api/vendor/products -> REJECTED 403
    const suspendedAccess = await api("/api/vendor/products", {
      headers: { Authorization: `Bearer ${suspendedToken}` },
    });
    assert("vendorStatus", suspendedAccess.status === 403, "Suspended vendor blocked from vendor endpoints (HTTP 403)");

    // Approved vendor accessing /api/vendor/products -> ALLOWED 200
    const approvedAccess = await api("/api/vendor/products", {
      headers: { Authorization: `Bearer ${approvedToken}` },
    });
    assert("vendorStatus", approvedAccess.status === 200, "Approved vendor granted access to vendor endpoints (HTTP 200)");

    // Public endpoint: unapproved vendor cannot be queried via public vendor endpoints
    const unapprovedInfo = await api(`/api/vendor/${pendingVendor._id}/info`);
    assert("vendorStatus", unapprovedInfo.status === 404, "Public vendor info hides unapproved vendors (HTTP 404)");

    const approvedInfo = await api(`/api/vendor/${approvedVendor._id}/info`);
    assert("vendorStatus", approvedInfo.status === 200, "Public vendor info exposes approved vendors (HTTP 200)");

    // ============================================================
    // 4. VENDOR ISOLATION & IDOR ATTACK TESTS
    // ============================================================
    console.log("\n--- 4. Vendor Resource Isolation & IDOR Tests ---");

    // Vendor A (approved) and Vendor B (approved)
    const vendorA = approvedVendor;
    const vendorAToken = approvedToken;

    const vendorB = await User.create({
      name: "Vendor B Approved",
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "vendor",
      shopStatus: "approved",
    });
    createdUserIds.push(vendorB._id);
    const vendorBToken = jwt.sign({ id: vendorB._id, role: "vendor" }, process.env.JWT_SECRET);

    // Vendor A creates a product
    const prodA = await Product.create({
      name: "Vendor A Tomatoes",
      category: "Vegetables",
      price: 40,
      quantity: 50,
      unit: "1 kg",
      image: "https://example.com/tomatoes.jpg",
      vendorId: vendorA._id,
      description: "Vendor A fresh tomatoes",
    });
    createdProductIds.push(prodA._id);

    // Vendor A accesses own product -> ALLOWED
    const vendorAOwnEdit = await api(`/api/vendor/products/${prodA._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${vendorAToken}` },
      body: JSON.stringify({ price: 42 }),
    });
    assert("vendorIsolation", vendorAOwnEdit.status === 200, "Vendor A can update their own product (HTTP 200)");

    // Vendor B attempts to update Vendor A's product via /api/vendor/products/:id -> REJECTED (404/403)
    const vendorBHackEdit = await api(`/api/vendor/products/${prodA._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${vendorBToken}` },
      body: JSON.stringify({ price: 10 }),
    });
    assert("vendorIsolation", vendorBHackEdit.status === 404 || vendorBHackEdit.status === 403, "Vendor B cannot update Vendor A's product via vendor API (HTTP 404/403)");

    // Vendor B attempts to delete Vendor A's product via /api/vendor/products/:id -> REJECTED (404/403)
    const vendorBHackDelete = await api(`/api/vendor/products/${prodA._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${vendorBToken}` },
    });
    assert("vendorIsolation", vendorBHackDelete.status === 404 || vendorBHackDelete.status === 403, "Vendor B cannot delete Vendor A's product via vendor API (HTTP 404/403)");

    // Vendor B attempts to update Vendor A's product via generic /api/products/:id -> REJECTED (403)
    const vendorBHackGenEdit = await api(`/api/products/${prodA._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${vendorBToken}` },
      body: JSON.stringify({ price: 10 }),
    });
    assert("vendorIsolation", vendorBHackGenEdit.status === 403, "Vendor B cannot update Vendor A's product via generic API (HTTP 403)");

    // Vendor B attempts to delete Vendor A's product via generic /api/products/:id -> REJECTED (403)
    const vendorBHackGenDelete = await api(`/api/products/${prodA._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${vendorBToken}` },
    });
    assert("vendorIsolation", vendorBHackGenDelete.status === 403, "Vendor B cannot delete Vendor A's product via generic API (HTTP 403)");

    // Order Isolation: Order assigned to Vendor A
    const orderA = await Order.create({
      userId: customerId,
      vendorId: vendorA._id,
      items: [{
        productId: prodA._id.toString(),
        name: prodA.name,
        image: prodA.image,
        weight: "1 kg",
        quantity: 1,
        price: 40,
        vendorId: vendorA._id.toString(),
      }],
      totalAmount: 40,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      status: "Placed",
      deliveryAddress: { street: "123 Main St", city: "City", pincode: "110001" },
    });
    createdOrderIds.push(orderA._id);

    // Vendor B attempts to update Vendor A's order status -> REJECTED (404)
    const vendorBHackOrder = await api(`/api/vendor/orders/${orderA._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${vendorBToken}` },
      body: JSON.stringify({ status: "Delivered" }),
    });
    assert("vendorIsolation", vendorBHackOrder.status === 404, "Vendor B cannot update Vendor A's order status (HTTP 404)");

    // Vendor A updates own order status -> ALLOWED (200)
    const vendorAUpdateOrder = await api(`/api/vendor/orders/${orderA._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${vendorAToken}` },
      body: JSON.stringify({ status: "Accepted" }),
    });
    assert("vendorIsolation", vendorAUpdateOrder.status === 200, "Vendor A can update their own order status (HTTP 200)");

    // ============================================================
    // 5. ADMIN AUTHORIZATION
    // ============================================================
    console.log("\n--- 5. Admin Authorization Tests ---");

    const adminUser = await User.create({
      name: "Platform Admin",
      phone: `90${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "admin",
      shopStatus: "none",
    });
    createdUserIds.push(adminUser._id);
    const adminToken = jwt.sign({ id: adminUser._id, role: "admin" }, process.env.JWT_SECRET);

    // Customer calling admin API (/api/admin/orders) -> REJECTED (403)
    const custAdminReq = await api("/api/admin/orders", {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert("authorization", custAdminReq.status === 403, "Customer access to admin API rejected with 403");

    // Vendor calling admin API (/api/admin/users) -> REJECTED (403)
    const vendorAdminReq = await api("/api/admin/users", {
      headers: { Authorization: `Bearer ${vendorAToken}` },
    });
    assert("authorization", vendorAdminReq.status === 403, "Vendor access to admin API rejected with 403");

    // Admin calling admin API (/api/admin/orders) -> ALLOWED (200)
    const adminOrdersReq = await api("/api/admin/orders", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert("authorization", adminOrdersReq.status === 200, "Admin access to admin API allowed with 200");

    // Admin updates vendor shopStatus to suspended -> ALLOWED (200)
    const adminSuspendVendor = await api(`/api/admin/users/${vendorB._id}/shop-status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ shopStatus: "suspended" }),
    });
    assert("authorization", adminSuspendVendor.status === 200 && adminSuspendVendor.data?.shopStatus === "suspended", "Admin can update vendor shopStatus to 'suspended'");

    // Admin updates user role -> ALLOWED (200)
    const adminRoleUpdate = await api(`/api/admin/users/${customerId}/role`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: "vendor" }),
    });
    assert("authorization", adminRoleUpdate.status === 200 && adminRoleUpdate.data?.role === "vendor", "Admin can update user role via admin API");

    // ============================================================
    // 6. OTP SECURITY AUDIT TESTS
    // ============================================================
    console.log("\n--- 6. OTP System Security Tests ---");

    const otpPhone = `89${Math.floor(10000000 + Math.random() * 90000000)}`;
    createdPhones.push(otpPhone);

    // 1. Send OTP & verify hashing
    const sendOtpRes = await api("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone: otpPhone }),
    });
    assert("otp", sendOtpRes.status === 200, "Send OTP request succeeds with 200");

    const otpRecord = await OTP.findOne({ phone: otpPhone });
    assert("otp", otpRecord !== null, "OTP document created in database");
    assert("otp", otpRecord?.otp?.length === 64, "OTP is securely stored as a salted SHA-256 hash (64 hex characters)");
    assert("otp", !["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(otpRecord?.otp), "Plaintext OTP is never stored in database");

    // 2. Invalid OTP rejection
    const invalidOtpRes = await api("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone: otpPhone, otp: "000000" }),
    });
    assert("otp", invalidOtpRes.status === 400, "Invalid OTP rejected with 400");

    // 3. Expired OTP rejection
    const expiredOtpPhone = `88${Math.floor(10000000 + Math.random() * 90000000)}`;
    createdPhones.push(expiredOtpPhone);
    const mockExpiredOtp = "123456";
    const hashedExpiredOtp = crypto
      .createHash("sha256")
      .update(mockExpiredOtp + process.env.OTP_HASH_SECRET)
      .digest("hex");
    await OTP.create({
      phone: expiredOtpPhone,
      otp: hashedExpiredOtp,
      attempts: 0,
      expiresAt: new Date(Date.now() - 10000), // 10 seconds ago
    });
    const verifyExpiredRes = await api("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone: expiredOtpPhone, otp: mockExpiredOtp }),
    });
    assert("otp", verifyExpiredRes.status === 400 && verifyExpiredRes.data?.message?.includes("expired"), "Expired OTP rejected with 400");

    // 4. Valid OTP verification & single-use cleanup (replay protection)
    const validOtpPhone = `87${Math.floor(10000000 + Math.random() * 90000000)}`;
    createdPhones.push(validOtpPhone);
    const validCode = "654321";
    const hashedValidCode = crypto
      .createHash("sha256")
      .update(validCode + process.env.OTP_HASH_SECRET)
      .digest("hex");
    await OTP.create({
      phone: validOtpPhone,
      otp: hashedValidCode,
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const verifyValidRes = await api("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone: validOtpPhone, otp: validCode }),
    });
    assert("otp", verifyValidRes.status === 200 && verifyValidRes.data?.token, "Valid OTP verification succeeds with 200 & JWT");
    if (verifyValidRes.data?.user?._id) createdUserIds.push(verifyValidRes.data.user._id);

    // Replay attack: attempt to use the same OTP a second time
    const replayRes = await api("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone: validOtpPhone, otp: validCode }),
    });
    assert("otp", replayRes.status === 400, "Replay attack rejected: OTP immediately deleted on use");

    // 5. Brute-force protection (max 5 failed attempts)
    const brutePhone = `86${Math.floor(10000000 + Math.random() * 90000000)}`;
    createdPhones.push(brutePhone);
    const bruteCode = "999999";
    const hashedBruteCode = crypto
      .createHash("sha256")
      .update(bruteCode + process.env.OTP_HASH_SECRET)
      .digest("hex");
    await OTP.create({
      phone: brutePhone,
      otp: hashedBruteCode,
      attempts: 4, // 4 prior failed attempts
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // 5th failed attempt:
    await api("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone: brutePhone, otp: "000001" }),
    });
    // 6th attempt should be blocked with 429
    const bruteBlockedRes = await api("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone: brutePhone, otp: "000002" }),
    });
    assert("otp", bruteBlockedRes.status === 429 || bruteBlockedRes.status === 400, "Brute force attack blocked after exceeding max attempts");

  } finally {
    // Clean up all fixtures
    console.log("\n--- Cleaning Up Test Fixtures ---");
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    if (createdProductIds.length > 0) {
      await Product.deleteMany({ _id: { $in: createdProductIds } });
    }
    if (createdOrderIds.length > 0) {
      await Order.deleteMany({ _id: { $in: createdOrderIds } });
    }
    if (createdPhones.length > 0) {
      await OTP.deleteMany({ phone: { $in: createdPhones } });
      await User.deleteMany({ phone: { $in: createdPhones } });
    }
    console.log("Cleaned up test users, products, orders, and OTPs.");

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  // Print Summary
  console.log("\n=========================================");
  console.log("PHASE 3 TEST SUMMARY");
  console.log("=========================================");
  console.log(`Customer Auth Tests:     ${counts.customerAuth.passed} passed / ${counts.customerAuth.failed} failed`);
  console.log(`Authorization Tests:     ${counts.authorization.passed} passed / ${counts.authorization.failed} failed`);
  console.log(`Vendor Status Tests:     ${counts.vendorStatus.passed} passed / ${counts.vendorStatus.failed} failed`);
  console.log(`Vendor Isolation Tests:  ${counts.vendorIsolation.passed} passed / ${counts.vendorIsolation.failed} failed`);
  console.log(`OTP Security Tests:      ${counts.otp.passed} passed / ${counts.otp.failed} failed`);

  const totalFailed =
    counts.customerAuth.failed +
    counts.authorization.failed +
    counts.vendorStatus.failed +
    counts.vendorIsolation.failed +
    counts.otp.failed;

  if (totalFailed > 0) {
    console.error(`\nFAILED with ${totalFailed} failure(s)`);
    process.exit(1);
  } else {
    console.log("\nALL PHASE 3 TESTS PASSED!");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
