require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("DB Connected");
};

const createAdmin = async () => {
  try {
    await connectDB();

    // 🔐 hash password
    const adminPhone = process.env.ADMIN_PHONE || "9359266118";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await User.findOneAndUpdate(
      { phone: adminPhone },
      {
        name: "Admin",
        email: "admin@farmsage.com",
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
    console.log(`Phone: ${adminPhone}`);
    console.log(`Password: ${adminPassword}`);
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

createAdmin();
