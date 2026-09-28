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

app.use(express.json());

// ─── CORS ───
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // open CORS for now (production deploy will tighten)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
