const nodemailer = require("nodemailer");

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 465;
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

const isTestEnv =
  process.env.NODE_ENV !== "production" &&
  (process.env.NODE_ENV === "test" ||
    process.env.DISABLE_EMAIL === "true" ||
    (Boolean(process.argv[1]) && process.argv[1].replace(/\\/g, "/").includes("/scripts/test")));

let transporter;
if (!isTestEnv) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  // Verify connection only if credentials configured
  if (smtpUser && smtpPass) {
    transporter.verify(function (error) {
      if (error) {
        console.warn("Mail Server verification notice:", error.message);
      } else {
        console.log("Mail Server is ready to deliver messages");
      }
    });
  } else {
    console.warn("[EMAIL CONFIG] SMTP credentials (SMTP_USER/PASS or EMAIL_USER/PASS) not configured. Outgoing emails will be skipped.");
  }
} else {
  // Local email sink for tests to prevent hitting external SMTP limits
  transporter = {
    sendMail: async ({ to, subject, html }) => {
      const messageId = `<mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@farmsage.test>`;
      return { messageId, to, subject, html };
    },
  };
}

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

    if (isTestEnv) {
      const messageId = `<mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@farmsage.test>`;
      console.log(`📩 [TEST EMAIL SINK] Mock email delivered: ${messageId} → ${to} (${subject})`);
      return { messageId, to, subject, html };
    }

    const info = await transporter.sendMail({
      from: `"FarmsAge 🌱" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    // ✅ FIX 3: Better logging
    console.log("📩 Email sent:", info.messageId, "→", to);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
};

module.exports = { sendEmail };
