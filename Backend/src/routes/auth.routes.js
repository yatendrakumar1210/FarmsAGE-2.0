const express = require("express");
const router = express.Router();

const {
  register,
  login,
  sendOTP,
  verifyOTP,
  completeProfile,
  googleLogin,
  getMe,
  saveAddress,
} = require("../controller/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

router.get("/me", authMiddleware, getMe);
router.post("/address", authMiddleware, saveAddress);
router.post("/register", register);
router.post("/login", login);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/complete-profile", authMiddleware, completeProfile);
router.post("/google" , googleLogin );

module.exports = router;
