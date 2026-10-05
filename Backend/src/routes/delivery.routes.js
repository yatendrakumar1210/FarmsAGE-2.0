const express = require("express");
const router = express.Router();

const {
  registerDeliveryPartner,
  getProfile,
  updateProfile,
  operationalCheck,
} = require("../controller/delivery.controller");

const authMiddleware = require("../middleware/auth.middleware");
const {
  deliveryAccountOnly,
  approvedDeliveryOnly,
} = require("../middleware/delivery.middleware");

// ─── Public Delivery Routes ──────────────────────────────────────────────
router.post("/register", registerDeliveryPartner);

// ─── Delivery Account Profile Routes (Accessible to pending/approved/rejected delivery partners)
router.get("/profile", authMiddleware, deliveryAccountOnly, getProfile);
router.put("/profile", authMiddleware, deliveryAccountOnly, updateProfile);

// ─── Operational Delivery Route (Accessible ONLY to approved delivery partners)
router.get("/operational-check", authMiddleware, approvedDeliveryOnly, operationalCheck);

module.exports = router;
