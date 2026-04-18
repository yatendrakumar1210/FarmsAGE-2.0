const express = require("express");
const router = express.Router();
const {
  getMyProducts,
  getGlobalProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getMyOrders,
  updateOrderStatus,
  getProfile,
  updateProfile,
  getNearbyVendors,
  getVendorProducts,
  getVendorInfo,
  registerShop,
} = require("../controller/vendor.controller");

const authMiddleware = require("../middleware/auth.middleware");
const vendorMiddleware = require("../middleware/vendor.middleware");

// ─── Public Routes (no auth needed) ───
router.get("/nearby", getNearbyVendors);
router.get("/:vendorId/products", getVendorProducts);
router.get("/:vendorId/info", getVendorInfo);

// ─── Protected Private Routes ───
router.use(authMiddleware);

// Registration (Needs to be accessible to users to become vendors)
router.post("/register-shop", registerShop);

// 🔒 Restricted to Vendors/Admins only
router.use(vendorMiddleware);

// Products
router.get("/products", getMyProducts);
router.get("/products/global", getGlobalProducts);
router.post("/products", addProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Orders
router.get("/orders", getMyOrders);
router.put("/orders/:id", updateOrderStatus);

// Profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

module.exports = router;
