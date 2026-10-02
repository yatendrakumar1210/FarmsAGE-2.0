const OTP = require("../models/otp.model");
const User = require("../models/user.model");
const generateOTP = require("../utils/generateOtp");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail");
const welcomeTemplate = require("../templates/welcomeTemplate");

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// REGISTER USER (Phone + Password)
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone number and password are required" });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "User with this phone number already exists" });
    }

    if (email && email.trim()) {
      const existingEmail = await User.findOne({ email: email.trim() });
      if (existingEmail) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name: name || "",
      phone,
      password: hashedPassword,
      role: "user",
      shopStatus: "none",
      authProvider: "password",
      isProfileComplete: true,
      isVerified: true,
    };

    if (email && email.trim()) {
      userData.email = email.trim();
    }

    const user = await User.create(userData);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN USER (Phone + Password)
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password are required" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "Invalid phone number or password" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Invalid phone number or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid phone number or password" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


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
    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      return res.status(400).json({ message: "Valid phone number is required" });
    }

    const cleanPhone = phone.trim();

    // Invalidate previous OTPs for this phone to prevent old codes from being reused
    await OTP.deleteMany({ phone: cleanPhone });

    const rawOtp = generateOTP();

    if (!process.env.OTP_HASH_SECRET) {
      return res.status(500).json({ message: "OTP configuration error: OTP_HASH_SECRET missing" });
    }

    // Store salted cryptographic hash of OTP directly using dedicated OTP_HASH_SECRET (no fallback)
    const hashedOtp = crypto
      .createHash("sha256")
      .update(rawOtp + process.env.OTP_HASH_SECRET)
      .digest("hex");

    await OTP.create({
      phone: cleanPhone,
      otp: hashedOtp,
      attempts: 0,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV ONLY] OTP for ${cleanPhone}: ${rawOtp}`);
    }

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

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone number and OTP are required" });
    }

    const cleanPhone = phone.trim();
    const cleanOtp = String(otp).trim();

    const record = await OTP.findOne({ phone: cleanPhone }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (record.expiresAt < Date.now()) {
      await OTP.deleteMany({ phone: cleanPhone });
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }

    // Maximum 5 verification attempts to prevent brute-force attacks
    if (record.attempts >= 5) {
      await OTP.deleteMany({ phone: cleanPhone });
      return res.status(429).json({
        message: "Too many failed attempts. This OTP has been invalidated. Please request a new one.",
      });
    }

    if (!process.env.OTP_HASH_SECRET) {
      return res.status(500).json({ message: "OTP configuration error: OTP_HASH_SECRET missing" });
    }

    const computedHash = crypto
      .createHash("sha256")
      .update(cleanOtp + process.env.OTP_HASH_SECRET)
      .digest("hex");

    const recordBuf = Buffer.from(record.otp, "utf8");
    const computedBuf = Buffer.from(computedHash, "utf8");

    if (
      recordBuf.length !== computedBuf.length ||
      !crypto.timingSafeEqual(recordBuf, computedBuf)
    ) {
      record.attempts += 1;
      await record.save();
      const remainingAttempts = 5 - record.attempts;
      return res.status(400).json({
        message: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`,
      });
    }

    // Invalidate immediately upon successful verification (prevents replay)
    await OTP.deleteMany({ phone: cleanPhone });

    let user = await User.findOne({ phone: cleanPhone });
    let isNewUser = false;

    if (!user) {
      user = await User.create({ phone: cleanPhone, isProfileComplete: false, role: "user", shopStatus: "none" });
      isNewUser = true;
    } else if (!user.isProfileComplete) {
      isNewUser = true;
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

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
    const { name, email } = req.body;

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name ? String(name).trim() : user.name;

    // Normal users can NEVER promote themselves to vendor or admin through completeProfile.
    // Vendor access strictly requires registering a shop and admin approval.
    if (!user.role) {
      user.role = "user";
    }

    if (email) user.email = email.trim();
    user.isProfileComplete = true;

    await user.save();

    // 📩 Send Welcome Email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Welcome to FarmsAge!",
        html: welcomeTemplate(user.name)
      });
    }

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

// GET CURRENT USER PROFILE & ADDRESSES
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SAVE / UPDATE ADDRESS
exports.saveAddress = async (req, res) => {
  try {
    const { name, phone, street, city, pincode, houseNumber, landmark, latitude, longitude, label } = req.body;
    if (!name || !phone || !street || !city || !pincode) {
      return res.status(400).json({ message: "Name, phone, street, city, and pincode are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newAddress = {
      name,
      phone,
      street,
      city,
      pincode,
      houseNumber: houseNumber || "",
      landmark: landmark || "",
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      label: label || "Home",
    };

    // Avoid duplicate address entries
    const exists = user.addresses.some(
      (a) =>
        a.street?.toLowerCase() === street.toLowerCase() &&
        a.pincode === pincode &&
        a.phone === phone
    );

    if (!exists) {
      user.addresses.push(newAddress);
    }

    user.defaultAddress = newAddress;
    await user.save();

    res.json({
      success: true,
      message: "Address saved successfully",
      addresses: user.addresses,
      defaultAddress: user.defaultAddress,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
