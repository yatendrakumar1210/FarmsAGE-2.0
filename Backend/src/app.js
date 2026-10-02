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
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// ─── CORS ───
const normalizeOrigin = (originUrl) => (originUrl ? originUrl.trim().replace(/\/+$/, '') : '');

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:3000',
  'https://farms-age-2-0-7fik.vercel.app',
  'https://farms-age-2-0-v32x.vercel.app'
];

const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([
  ...defaultAllowedOrigins,
  normalizeOrigin(process.env.FRONTEND_URL),
  normalizeOrigin(process.env.ADMIN_URL),
  ...envOrigins
])).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalizedOrigin) || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy error: Origin ${origin} is not allowed`));
    }
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
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

module.exports = app;
