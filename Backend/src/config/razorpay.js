const Razorpay = require("razorpay");

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required in production");
  }
  console.warn("[PAYMENT CONFIG] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured. Payments will fail until set.");
}

module.exports = new Razorpay({
  key_id: key_id || "placeholder_dev_key",
  key_secret: key_secret || "placeholder_dev_secret",
});

