const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Verify connection (keep this)
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Mail Server Error:", error.message);
  } else {
    console.log("✅ Mail Server is ready to take our messages");
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    // ✅ FIX 1: Strong validation
    if (!to || typeof to !== "string" || !to.includes("@")) {
      console.warn("⚠️ Email skipped: Invalid recipient ->", to);
      return;
    }

    // ✅ FIX 2: Prevent empty content
    if (!subject || !html) {
      console.warn("⚠️ Email skipped: Missing subject or html");
      return;
    }

    const info = await transporter.sendMail({
      from: `"FarmsAge 🌱" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    // ✅ FIX 3: Better logging
    console.log("📩 Email sent:", info.messageId, "→", to);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
};

module.exports = { sendEmail };
