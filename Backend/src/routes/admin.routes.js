const express = require("express");
const router = express.Router();
const {
  getOrders,
  updateOrder,
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getUsers,
  updateUserRole,
  updateShopStatus,
  getBroadcast,
  setBroadcast,
  clearBroadcast,
  getCoupons,
  createCoupon,
  deleteCoupon,
  getDeliveryPartners,
  updateDeliveryPartnerStatus,
} = require("../controller/admin.controller");

const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

// 📢 Public storefront broadcast route (no auth required)
router.get("/broadcast", getBroadcast);

// Protected admin routes
router.use(authMiddleware, adminMiddleware);

// Broadcast management
router.post("/broadcast", setBroadcast);
router.delete("/broadcast", clearBroadcast);

// Coupon management
router.get("/coupons", getCoupons);
router.post("/coupons", createCoupon);
router.delete("/coupons/:id", deleteCoupon);

router.get("/orders", getOrders);
router.put("/orders/:id", updateOrder);

router.get("/products", getProducts);
router.post("/products", addProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/shop-status", updateShopStatus);

// Delivery partner management
router.get("/delivery-partners", getDeliveryPartners);
router.put("/delivery-partners/:id/status", updateDeliveryPartnerStatus);

module.exports = router;
