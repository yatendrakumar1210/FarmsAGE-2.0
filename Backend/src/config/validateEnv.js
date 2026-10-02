/**
 * Environment Validation Utility for FarmsAGE 2.0 Backend
 *
 * Validates required environment variables at application startup.
 * - In production: Fails startup immediately if any required secret is missing.
 * - In development: Warns about missing variables without using insecure fallbacks.
 * - Security: NEVER prints secret values to logs or console.
 */

const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === "production";

  // MongoDB URI can be defined as MONGODB_URI or MONGO_URI
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (mongoUri && !process.env.MONGODB_URI) {
    process.env.MONGODB_URI = mongoUri;
  }

  // Critical secrets required for core operation
  const requiredAlways = [
    { key: "JWT_SECRET", name: "JWT Secret Key" },
    { key: "MONGODB_URI", name: "MongoDB Connection URI" },
  ];

  // Secrets strictly required in production
  const requiredInProduction = [
    ...requiredAlways,
    { key: "OTP_HASH_SECRET", name: "OTP Hashing Secret" },
    { key: "RAZORPAY_KEY_ID", name: "Razorpay Key ID" },
    { key: "RAZORPAY_KEY_SECRET", name: "Razorpay Key Secret" },
    { key: "FRONTEND_URL", name: "Production Frontend URL" },
  ];

  const targetList = isProduction ? requiredInProduction : requiredAlways;
  const missingCritical = [];

  for (const item of targetList) {
    const val = process.env[item.key];
    if (!val || typeof val !== "string" || val.trim().length === 0) {
      missingCritical.push(item);
    }
  }

  if (missingCritical.length > 0) {
    console.error("==================================================");
    console.error("  [FATAL] MISSING REQUIRED ENVIRONMENT VARIABLES  ");
    console.error("==================================================");
    missingCritical.forEach((item) => {
      console.error(`  - ${item.key} (${item.name})`);
    });
    console.error("Please configure these variables in your .env file or environment.");
    console.error("Server startup aborted to prevent insecure operation.");
    console.error("==================================================");
    throw new Error(
      `Missing required environment variables: ${missingCritical.map((i) => i.key).join(", ")}`
    );
  }

  // Non-fatal warnings for development
  if (!isProduction) {
    const optionalInDev = [
      { key: "OTP_HASH_SECRET", name: "OTP Hashing Secret" },
      { key: "RAZORPAY_KEY_ID", name: "Razorpay Key ID" },
      { key: "RAZORPAY_KEY_SECRET", name: "Razorpay Key Secret" },
      { key: "FRONTEND_URL", name: "Frontend URL" },
      { key: "GOOGLE_CLIENT_ID", name: "Google OAuth Client ID" },
    ];

    const missingDev = optionalInDev.filter(
      (item) => !process.env[item.key] || process.env[item.key].trim().length === 0
    );

    if (missingDev.length > 0) {
      console.warn("[CONFIG ADVISORY] Missing optional development environment variables:");
      missingDev.forEach((item) => {
        console.warn(`  - ${item.key} (${item.name})`);
      });
    }
  }

  return true;
};

module.exports = validateEnv;
