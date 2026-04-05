const express = require("express");
const router = express.Router();

const {
  sendOTP,
  verifyOTP,
  completeProfile,
} = require("../controller/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/complete-profile", authMiddleware, completeProfile);

module.exports = router;
