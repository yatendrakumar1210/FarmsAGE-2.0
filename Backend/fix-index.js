const mongoose = require("mongoose");
const User = require("./src/models/user.model");
require("dotenv").config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    console.log("Syncing indexes for User model...");
    await User.syncIndexes();

    console.log("Indexes synced successfully.");
  } catch (err) {
    console.error("Error fixing indexes:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

fixIndexes();
