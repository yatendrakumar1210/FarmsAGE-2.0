const express = require('express');
require("dotenv").config();
const cors = require('cors');
const compression = require('compression');
const connectDB = require('./db/db');
const authSystem = require('./routes/auth.routes');
const paymentSystem = require('./routes/order.routes');
const adminSystem = require('./routes/admin.routes');
const addressSystem = require('./routes/address.routes');
const productsSystem = require('./routes/products.routes');
const vendorSystem = require('./routes/vendor.routes');

const app = express();

// ─── Compression (Gzip/Brotli) — reduces transfer by ~70% ───
app.use(compression({
  level: 6,
  threshold: 1024, // compress anything > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── CORS ───
const isProduction = process.env.NODE_ENV === "production";

const normalizeOrigin = (originUrl) => (originUrl ? String(originUrl).trim().replace(/\/+$/, '') : '');

const devOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:3000',
].map(normalizeOrigin);

const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const configuredFrontend = normalizeOrigin(process.env.FRONTEND_URL);
const configuredAdmin = normalizeOrigin(process.env.ADMIN_URL);
const prodOrigins = Array.from(new Set([
  configuredFrontend,
  configuredAdmin,
  ...envOrigins
])).filter(Boolean);

const isLocalhostOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    const normalizedOrigin = normalizeOrigin(origin);

    if (isProduction) {
      if (prodOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy error: Origin ${origin} is not allowed`));
    }

    if (isLocalhostOrigin(normalizedOrigin) || devOrigins.includes(normalizedOrigin) || prodOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy error: Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature'],
}));

connectDB();

app.use('/api/auth', authSystem);
app.use('/api/orders', paymentSystem);
app.use('/api/admin', adminSystem);
app.use('/api/address', addressSystem);
app.use('/api/products', productsSystem);
app.use('/api/vendor', vendorSystem);

app.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, status: 'FarmsAge API Server Running', ts: Date.now() });
});

app.get('/', (req, res) => {
  res.send('FarmsAge 2.0 API server active');
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  // Handle CORS errors specifically
  if (err.message && err.message.startsWith("CORS policy error")) {
    return res.status(403).json({
      success: false,
      message: "Access forbidden by CORS policy",
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";

  let errorMsg = err.message || "An error occurred";
  if (statusCode === 413 || err.type === "entity.too.large") {
    errorMsg = "Request payload too large. Please upload an image under 10MB.";
  } else if (isProd && statusCode >= 500) {
    errorMsg = "Internal Server Error";
  }

  res.status(statusCode).json({
    success: false,
    message: errorMsg,
  });
});

module.exports = app;
