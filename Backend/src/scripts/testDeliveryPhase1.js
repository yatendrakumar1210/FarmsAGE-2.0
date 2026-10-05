const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../app");
const User = require("../models/user.model");

let server;
let baseUrl;

const createdUserIds = [];

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
  console.log("DELIVERY PHASE 1 TEST SUITE");
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
    // Admin user for status management
    const adminUser = await User.create({
      name: "Admin Tester",
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "admin",
    });
    createdUserIds.push(adminUser._id);
    const adminToken = jwt.sign(
      { id: adminUser._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ------------------------------------------------------------------------
    // 1 & 2. SEPARATE DELIVERY REGISTRATION FLOW (Server forces role & pending)
    // ------------------------------------------------------------------------
    console.log("\n--- 1 & 2. Delivery Registration & Server-Enforced Fields ---");
    const dpPhone = `91${Math.floor(10000000 + Math.random() * 90000000)}`;
    const dpEmail = `rider_${Date.now()}@example.com`;

    const regRes = await api("/api/delivery/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Ramesh Kumar Rider",
        phone: dpPhone,
        email: dpEmail,
        password: "RiderPassword123!",
        vehicleType: "Electric Vehicle",
        vehicleNumber: "DL01EV9999",
        drivingLicenceNumber: "DL-1420110099999",
        // Attack attempt: client tries to pass approved or admin role
        role: "admin",
        deliveryStatus: "approved",
        isAvailable: true,
      }),
    });

    assert(regRes.status === 201, "Delivery registration endpoint returns 201 Created", JSON.stringify(regRes.data));
    assert(Boolean(regRes.data?.token), "Registration issues a valid JWT token");
    
    const dpUser = regRes.data?.user;
    if (dpUser) {
      createdUserIds.push(dpUser._id);
    }
    assert(dpUser?.role === "delivery", "Server enforces role='delivery' (client role='admin' ignored)");
    assert(dpUser?.deliveryStatus === "pending", "Server enforces deliveryStatus='pending' (client deliveryStatus='approved' ignored)");
    assert(dpUser?.isAvailable === false, "Server enforces isAvailable=false (client isAvailable=true ignored)");
    assert(dpUser?.vehicleDetails?.vehicleType === "Electric Vehicle", "Vehicle type correctly persisted");
    assert(dpUser?.vehicleDetails?.vehicleNumber === "DL01EV9999", "Vehicle number correctly persisted");
    assert(dpUser?.drivingLicenceNumber === "DL-1420110099999", "Driving licence correctly persisted");

    const dpToken = regRes.data?.token;

    // Duplicate registration should fail
    const dupRes = await api("/api/delivery/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Another Rider",
        phone: dpPhone,
        password: "Pass1234",
      }),
    });
    assert(dupRes.status === 400, "Duplicate phone registration rejected with 400");

    // ------------------------------------------------------------------------
    // 3. SECURITY: Customer cannot inject role="delivery" through normal registration
    // ------------------------------------------------------------------------
    console.log("\n--- 3. Role Injection via Customer Registration Blocked ---");
    const custPhone = `92${Math.floor(10000000 + Math.random() * 90000000)}`;
    const custRes = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Sneaky Customer",
        phone: custPhone,
        password: "CustPassword123!",
        role: "delivery", // Attempted role escalation
      }),
    });

    assert(custRes.status === 201, "Customer registered successfully");
    const custUser = custRes.data?.user;
    if (custUser) createdUserIds.push(custUser._id);
    assert(custUser?.role === "user", "Customer role forced to 'user' despite role='delivery' in payload");
    assert(custUser?.deliveryStatus === "none", "Customer deliveryStatus is 'none'");

    const custToken = custRes.data?.token;

    // ------------------------------------------------------------------------
    // 4. SECURITY: Customer cannot change role to "delivery" via completeProfile
    // ------------------------------------------------------------------------
    console.log("\n--- 4. Role Escalation via Profile Update Blocked ---");
    const profileRes = await api("/api/auth/complete-profile", {
      method: "POST",
      headers: { Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        name: "Still Sneaky",
        email: `sneaky_${Date.now()}@example.com`,
        role: "delivery", // Attempted role injection
        deliveryStatus: "approved",
      }),
    });

    assert(profileRes.status === 200, "Customer complete-profile responds with 200");
    const updatedCust = await User.findById(custUser._id);
    assert(updatedCust.role === "user", "Customer role remains 'user' after completeProfile");
    assert(updatedCust.deliveryStatus === "none", "Customer deliveryStatus remains 'none'");

    // ------------------------------------------------------------------------
    // 5. SECURITY: Customer rejected from delivery operational & profile APIs
    // ------------------------------------------------------------------------
    console.log("\n--- 5. Customer Access to Delivery APIs Blocked ---");
    const custDeliveryAccess = await api("/api/delivery/operational-check", {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    assert(custDeliveryAccess.status === 403, "Customer blocked from operational delivery API with 403");

    const custProfileAccess = await api("/api/delivery/profile", {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    assert(custProfileAccess.status === 403, "Customer blocked from delivery profile API with 403");

    // ------------------------------------------------------------------------
    // 6. Pending Delivery Partner rejected from operational APIs
    // ------------------------------------------------------------------------
    console.log("\n--- 6. Pending Delivery Partner Blocked from Operational APIs ---");
    const pendingOpRes = await api("/api/delivery/operational-check", {
      headers: { Authorization: `Bearer ${dpToken}` },
    });
    assert(pendingOpRes.status === 403, "Pending delivery partner receives 403 on operational API");
    assert(pendingOpRes.data?.deliveryStatus === "pending", "Response indicates status is pending");

    // But pending partner CAN access and update their own delivery profile
    const pendingProfRes = await api("/api/delivery/profile", {
      headers: { Authorization: `Bearer ${dpToken}` },
    });
    assert(pendingProfRes.status === 200, "Pending delivery partner can access their delivery profile", JSON.stringify(pendingProfRes.data));
    assert(pendingProfRes.data?.user?.deliveryStatus === "pending", "Profile reflects pending deliveryStatus");

    // ------------------------------------------------------------------------
    // 7. Delivery Partner Profile Update & Isolation
    // ------------------------------------------------------------------------
    console.log("\n--- 7. Delivery Partner Profile Updates & Isolation ---");
    const updateProfRes = await api("/api/delivery/profile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${dpToken}` },
      body: JSON.stringify({
        vehicleNumber: "DL01EV1111",
        vehicleType: "Scooter",
        // Attempt to self-approve or elevate role
        role: "admin",
        deliveryStatus: "approved",
      }),
    });
    assert(updateProfRes.status === 200, "Delivery profile updated successfully");
    assert(updateProfRes.data?.user?.vehicleDetails?.vehicleNumber === "DL01EV1111", "Vehicle number updated");
    assert(updateProfRes.data?.user?.vehicleDetails?.vehicleType === "Scooter", "Vehicle type updated");
    assert(updateProfRes.data?.user?.role === "delivery", "Role remains 'delivery' (client role='admin' ignored)");
    assert(updateProfRes.data?.user?.deliveryStatus === "pending", "Status remains 'pending' (client deliveryStatus='approved' ignored)");

    // ------------------------------------------------------------------------
    // 8. ADMIN MANAGEMENT: View Delivery Partners
    // ------------------------------------------------------------------------
    console.log("\n--- 8. Admin View Delivery Partners ---");
    const adminGetPartners = await api("/api/admin/delivery-partners", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminGetPartners.status === 200, "Admin can list delivery partners");
    const foundPartner = adminGetPartners.data?.find((p) => p._id === dpUser._id);
    assert(Boolean(foundPartner), "Registered delivery partner found in admin list");

    const nonAdminGetPartners = await api("/api/admin/delivery-partners", {
      headers: { Authorization: `Bearer ${dpToken}` },
    });
    assert(nonAdminGetPartners.status === 403, "Non-admin blocked from admin delivery partner list");

    // ------------------------------------------------------------------------
    // 9. ADMIN APPROVAL: Admin approves delivery partner
    // ------------------------------------------------------------------------
    console.log("\n--- 9. Admin Approves Delivery Partner ---");
    const approveRes = await api(`/api/admin/delivery-partners/${dpUser._id}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "approved" }),
    });
    assert(approveRes.status === 200, "Admin approved delivery partner with 200");
    assert(approveRes.data?.partner?.deliveryStatus === "approved", "Partner status updated to 'approved'");

    // Approved partner now authorized on operational check
    const approvedOpRes = await api("/api/delivery/operational-check", {
      headers: { Authorization: `Bearer ${dpToken}` },
    });
    assert(approvedOpRes.status === 200, "Approved delivery partner authorized on operational API");

    // ------------------------------------------------------------------------
    // 10. ADMIN REJECTION: Admin rejects delivery partner
    // ------------------------------------------------------------------------
    console.log("\n--- 10. Admin Rejects Delivery Partner ---");
    const rejectRes = await api(`/api/admin/delivery-partners/${dpUser._id}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "rejected" }),
    });
    assert(rejectRes.status === 200, "Admin rejected delivery partner");
    assert(rejectRes.data?.partner?.deliveryStatus === "rejected", "Partner status updated to 'rejected'");

    const rejectedOpRes = await api("/api/delivery/operational-check", {
      headers: { Authorization: `Bearer ${dpToken}` },
    });
    assert(rejectedOpRes.status === 403, "Rejected delivery partner blocked from operational API with 403");

    // Rejected partner editing profile resets status to pending for reconsideration
    const reapplyRes = await api("/api/delivery/profile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${dpToken}` },
      body: JSON.stringify({ drivingLicenceNumber: "DL-UPDATED-LICENCE" }),
    });
    assert(reapplyRes.status === 200, "Rejected partner can update profile");
    assert(reapplyRes.data?.user?.deliveryStatus === "pending", "Status automatically resets to 'pending' for resubmission");

    // ------------------------------------------------------------------------
    // 11, 12, 13, 14. ADMIN SUSPENSION: Forces isAvailable=false
    // ------------------------------------------------------------------------
    console.log("\n--- 11, 12, 13, 14. Admin Suspension & Availability Guard ---");
    // First approve
    await api(`/api/admin/delivery-partners/${dpUser._id}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "approved" }),
    });

    // Manually set isAvailable = true in DB for testing suspension reset
    await User.findByIdAndUpdate(dpUser._id, { isAvailable: true });
    const userBeforeSuspension = await User.findById(dpUser._id);
    assert(userBeforeSuspension.isAvailable === true, "Partner is available before suspension");

    // Admin suspends partner
    const suspendRes = await api(`/api/admin/delivery-partners/${dpUser._id}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "suspended" }),
    });
    assert(suspendRes.status === 200, "Admin suspended delivery partner");
    assert(suspendRes.data?.partner?.deliveryStatus === "suspended", "Status is 'suspended'");
    assert(suspendRes.data?.partner?.isAvailable === false, "Suspension immediately forced isAvailable=false in DB");

    // Suspended partner rejected from operational API
    const suspendedOpRes = await api("/api/delivery/operational-check", {
      headers: { Authorization: `Bearer ${dpToken}` },
    });
    assert(suspendedOpRes.status === 403, "Suspended delivery partner receives 403 on operational API");

    // Suspended partner cannot modify profile
    const suspendedUpdateProf = await api("/api/delivery/profile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${dpToken}` },
      body: JSON.stringify({ name: "Cannot Update" }),
    });
    assert(suspendedUpdateProf.status === 403, "Suspended delivery partner blocked from modifying profile");

    // Reactivation sets approved but keeps isAvailable=false
    const reactivateRes = await api(`/api/admin/delivery-partners/${dpUser._id}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "approved" }),
    });
    assert(reactivateRes.status === 200, "Admin reactivated partner to approved");
    assert(reactivateRes.data?.partner?.deliveryStatus === "approved", "Status is 'approved'");
    assert(reactivateRes.data?.partner?.isAvailable === false, "Reactivation keeps isAvailable=false (partner must toggle later)");

    // ------------------------------------------------------------------------
    // 15. Admin cannot change normal user/vendor to delivery via delivery endpoint
    // ------------------------------------------------------------------------
    console.log("\n--- 15. Non-Delivery Users Protected from Delivery Status Endpoint ---");
    const nonDpApprove = await api(`/api/admin/delivery-partners/${custUser._id}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "approved" }),
    });
    assert(nonDpApprove.status === 400, "Admin cannot set delivery status on normal customer (returns 400)");

    // ------------------------------------------------------------------------
    // 16. Admin cannot convert customer to delivery via updateUserRole
    // ------------------------------------------------------------------------
    console.log("\n--- 16. Customer to Delivery Conversion Blocked in Admin updateUserRole ---");
    const roleConvertRes = await api(`/api/admin/users/${custUser._id}/role`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: "delivery" }),
    });
    assert(roleConvertRes.status === 400, "Admin role conversion to 'delivery' rejected with 400");
    const checkCustRole = await User.findById(custUser._id);
    assert(checkCustRole.role === "user", "Customer role remains 'user'");

    // ------------------------------------------------------------------------
    // 17. Invalid delivery partner IDs handled safely (no server crash)
    // ------------------------------------------------------------------------
    console.log("\n--- 17. Safe Handling of Invalid Partner IDs ---");
    const invalidFormatRes = await api("/api/admin/delivery-partners/invalid-id-format/status", {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "approved" }),
    });
    assert(invalidFormatRes.status === 400, "Invalid ObjectId format returns 400 gracefully");

    const nonExistentId = new mongoose.Types.ObjectId();
    const nonExistentRes = await api(`/api/admin/delivery-partners/${nonExistentId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "approved" }),
    });
    assert(nonExistentRes.status === 404, "Non-existent delivery partner returns 404 gracefully");

    // Invalid status string rejected
    const invalidStatusRes = await api(`/api/admin/delivery-partners/${dpUser._id}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "super_approved" }),
    });
    assert(invalidStatusRes.status === 400, "Invalid status string returns 400");

    // ------------------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------------------
    console.log("\n--- Cleaning Up Test Fixtures ---");
    await User.deleteMany({ _id: { $in: createdUserIds } });
    console.log("Cleaned up test fixtures.");

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log("\n==================================================");
  console.log("DELIVERY PHASE 1 TEST SUMMARY");
  console.log("==================================================");
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log("ALL PHASE 1 TESTS PASSED!\n");
  } else {
    console.error("SOME PHASE 1 TESTS FAILED!\n");
    process.exit(1);
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal test error:", err);
    process.exit(1);
  });
