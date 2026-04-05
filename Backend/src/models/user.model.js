const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "user",
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    addresses: [
      {
        name: String,
        phone: String,
        street: String,
        city: String,
        pincode: String,
      },
    ],

    defaultAddress: {
      type: Object,
    },

    lastLogin: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
