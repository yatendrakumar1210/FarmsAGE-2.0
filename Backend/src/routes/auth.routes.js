const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  sendOTP,
  verifyOTP,
  completeProfile,
  googleLogin,
  getMe,
  saveAddress,
} = require("../controller/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

const rateLimit = require("express-rate-limit");

// Rate limit OTP generation: max 5 requests per 10 minutes per IP
const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many OTP requests from this IP. Please wait 10 minutes before requesting again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit OTP verification: max 10 attempts per 10 minutes per IP
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many verification attempts from this IP. Please wait 10 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/me", authMiddleware, getMe);
router.post("/address", authMiddleware, saveAddress);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/send-otp", otpSendLimiter, sendOTP);
router.post("/verify-otp", otpVerifyLimiter, verifyOTP);
router.post("/complete-profile", authMiddleware, completeProfile);
router.post("/google" , googleLogin );

module.exports = router;
