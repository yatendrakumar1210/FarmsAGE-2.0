const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    weight: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    name: String,
    image: String,
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    items: [orderItemSchema],

    status: {
      type: String,
      enum: [
        "Placed",
        "Pending",
        "Accepted",
        "Packing",
        "Processing",
        "OutForDelivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Placed",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    paymentMethod: {
      type: String,
      enum: ["Online", "COD"],
      default: "COD",
    },

    paymentId: {
      type: String,
      sparse: true,
      index: true,
    },

    razorpayOrderId: {
      type: String,
      sparse: true,
      index: true,
    },

    inventoryDeducted: {
      type: Boolean,
      default: false,
      index: true,
    },

    paymentProcessingAt: {
      type: Date,
      default: null,
    },

    emailSent: {
      type: Boolean,
      default: false,
    },

    currency: {
      type: String,
      default: "INR",
    },

    deliveryAddress: {
      name: String,
      phone: String,
      street: String,
      city: String,
      pincode: String,
      houseNumber: String,
      landmark: String,
      latitude: Number,
      longitude: Number,
      label: {
        type: String,
        default: "Home",
      },
    },

    totalAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
