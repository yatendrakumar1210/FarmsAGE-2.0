const Razorpay = require("razorpay");

module.exports = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_SWa3PA5oApBh4b",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "SwqyIaHNcC2KeBOzNKddApnJ",
});
