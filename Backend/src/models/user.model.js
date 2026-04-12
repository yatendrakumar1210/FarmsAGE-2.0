const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      unique: true,
      sparse: true, // ✅ allows null values
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
    },

    googleId: {
      type: String,
    },

    name: {
      type: String,
      default: "",
    },

    profilePic: String,

    authProvider: {
      type: String,
      enum: ["otp", "google"],
      default: "otp",
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
      default: true, // ✅ Google users are already verified
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
