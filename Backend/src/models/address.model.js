const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  address: String,
  latitude: Number,
  longitude: Number,
}, { timestamps: true });

module.exports = mongoose.model("Address", addressSchema);