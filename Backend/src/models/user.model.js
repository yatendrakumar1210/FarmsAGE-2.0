const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      unique: true,
      sparse: true, // ✅ allows null values
      required: false
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

    // Vendor-specific fields
    storeName: {
      type: String,
      default: "",
    },

    specialty: {
      type: String,
      default: "",
    },

    storeImage: {
      type: String,
      default: "",
    },

    storeAddress: {
      type: String,
      default: "",
    },

    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    shopStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
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
