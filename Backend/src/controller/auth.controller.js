const OTP = require("../models/otp.model");
const User = require("../models/user.model");
const generateOTP = require("../utils/generateOtp");
const jwt = require("jsonwebtoken");

// SEND OTP
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    const otp = generateOTP();

    await OTP.create({
      phone,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    console.log("OTP:", otp); 

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// VERIFY OTP (LOGIN / REGISTER)
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const record = await OTP.findOne({ phone, otp });

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (record.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      user = await User.create({ phone });
      isNewUser = true;
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    await OTP.deleteMany({ phone });

    res.json({
      success: true,
      token,
      user,
      isNewUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// COMPLETE PROFILE 
exports.completeProfile = async (req, res) => {
  try {
    const { name, role } = req.body;

    const user = await User.findById(req.user.id);

    user.name = name;
    user.role = role; // user / vendor
    user.isProfileComplete = true;

    await user.save();

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
