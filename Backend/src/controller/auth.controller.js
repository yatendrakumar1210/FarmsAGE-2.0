const OTP = require("../models/otp.model");
const User = require("../models/user.model");
const generateOTP = require("../utils/generateOtp");
const jwt = require("jsonwebtoken");

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { idToken, access_token } = req.body;

    if (!idToken && !access_token) {
      return res.status(400).json({ message: "Token required" });
    }

    let email, name, picture, sub;

    // ✅ Handle either idToken or access_token
    if (idToken) {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      sub = payload.sub;
    } else if (access_token) {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!response.ok) {
        return res.status(400).json({ message: "Invalid access token" });
      }
      const data = await response.json();
      email = data.email;
      name = data.name;
      picture = data.picture;
      sub = data.sub;
    }

    // ✅ Check user by email
    let user = await User.findOne({ email });

    let isNewUser = false;
    if (!user) {
      // ✅ Create new Google user
      user = await User.create({
        email,
        name,
        profilePic: picture,
        googleId: sub,
        authProvider: "google",
        isVerified: true,
        isProfileComplete: false
      });
      isNewUser = true;
    } else if (!user.isProfileComplete) {
      isNewUser = true;
    }

    // ✅ Update last login
    user.lastLogin = new Date();
    await user.save();

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      message: "Google login success",
      token,
      user,
      isNewUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Google login failed" });
  }
};
 

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
      user = await User.create({ phone, isProfileComplete: false });
      isNewUser = true;
    } else if (!user.isProfileComplete) {
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

    // 🔑 Generate NEW token with updated role (very important!)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token, // Send new token to frontend
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
