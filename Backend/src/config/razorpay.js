const Razorpay = require("razorpay");

const key_id = process.env.RAZORPAY_KEY_ID || "";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "";

if (!key_id || !key_secret) {
  console.warn("WARNING: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in environment variables.");
}

module.exports = new Razorpay({
  key_id,
  key_secret,
});

