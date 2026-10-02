const mongoose = require('mongoose');

// ─── Connection state guard — prevents repeated connect() calls ───
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      throw new Error("Database connection error: MONGODB_URI / MONGO_URI environment variable is missing");
    }

    const conn = await mongoose.connect(uri, {
      // ─── Connection Pool ───────────────────────────────────────
      maxPoolSize: 10,          // max connections in pool
      minPoolSize: 2,           // keep 2 connections warm
      socketTimeoutMS: 30000,   // close sockets after 30s of inactivity
      serverSelectionTimeoutMS: 5000, // fail fast if DB unreachable
      // ─── Heartbeat to prevent idle disconnections on Render ────
      heartbeatFrequencyMS: 10000,
    });

    isConnected = true;
    console.log(`Database connected: ${conn.connection.host}`);

    // Handle connection drops — reset flag so next request reconnects
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected — will reconnect on next request');
      isConnected = false;
    });

  } catch (error) {
    isConnected = false;
    console.error("Database connection Error:", error.message);
  }
};

module.exports = connectDB;