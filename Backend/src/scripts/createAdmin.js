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

    // 🔍 check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("❌ Admin already exists!");
      process.exit();
    }

    // 🔐 hash password
    const hashedPassword = await bcrypt.hash("YT639588", 10);

    // ✅ create admin
    await User.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: hashedPassword,
      phone: "9359266118",
      role: "admin",
    });

    console.log("✅ Admin created successfully!");
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

createAdmin();
