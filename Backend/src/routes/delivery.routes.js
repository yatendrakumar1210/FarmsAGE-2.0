const express = require("express");
const router = express.Router();

const {
  registerDeliveryPartner,
  getProfile,
  updateProfile,
  operationalCheck,
  updateAvailability,
  getDeliveryDashboard,
  getAvailableOrders,
  acceptDeliveryOrder,
  getActiveDelivery,
  getDeliveryOrderDetail,
  getDeliveryHistory,
} = require("../controller/delivery.controller");

const authMiddleware = require("../middleware/auth.middleware");
const {
  deliveryAccountOnly,
  approvedDeliveryOnly,
  onlineApprovedDeliveryOnly,
} = require("../middleware/delivery.middleware");

// ─── Public Delivery Routes ──────────────────────────────────────────────
router.post("/register", registerDeliveryPartner);

// ─── Delivery Account Profile Routes (Accessible to pending/approved/rejected delivery partners)
router.get("/profile", authMiddleware, deliveryAccountOnly, getProfile);
router.put("/profile", authMiddleware, deliveryAccountOnly, updateProfile);

// ─── Operational Delivery Routes (Accessible ONLY to approved delivery partners)
router.get("/operational-check", authMiddleware, approvedDeliveryOnly, operationalCheck);
router.put("/availability", authMiddleware, approvedDeliveryOnly, updateAvailability);
router.get("/dashboard", authMiddleware, approvedDeliveryOnly, getDeliveryDashboard);
router.get("/orders/active", authMiddleware, approvedDeliveryOnly, getActiveDelivery);
router.get("/orders/history", authMiddleware, approvedDeliveryOnly, getDeliveryHistory);

// ─── Online-Only Operational Routes (Requires approved delivery partner to be ONLINE)
router.get("/orders/available", authMiddleware, approvedDeliveryOnly, onlineApprovedDeliveryOnly, getAvailableOrders);
router.put("/orders/:orderId/accept", authMiddleware, approvedDeliveryOnly, onlineApprovedDeliveryOnly, acceptDeliveryOrder);

// ─── Delivery Order Detail (Pre-acceptance safe preview or post-acceptance full details)
router.get("/orders/:orderId", authMiddleware, approvedDeliveryOnly, getDeliveryOrderDetail);

module.exports = router;
