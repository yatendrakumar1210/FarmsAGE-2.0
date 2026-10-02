require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGODB_URI / MONGO_URI is required");
  }
  await mongoose.connect(uri);
  console.log("DB Connected");
};

const createAdmin = async () => {
  try {
    await connectDB();

    const adminPhone = process.env.ADMIN_PHONE;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPhone || !adminPassword) {
      throw new Error("ADMIN_PHONE and ADMIN_PASSWORD environment variables are required to create an admin account.");
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await User.findOneAndUpdate(
      { phone: adminPhone },
      {
        name: "Admin",
        email: process.env.ADMIN_EMAIL || "admin@farmsage.com",
        password: hashedPassword,
        phone: adminPhone,
        role: "admin",
        authProvider: "password",
        isProfileComplete: true,
        isVerified: true
      },
      { upsert: true, new: true }
    );

    console.log("✅ Admin user created/updated successfully!");
    console.log(`Admin configured for phone: ${adminPhone}`);
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

createAdmin();
