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
} = require("../controller/admin.controller");

const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

router.use(authMiddleware, adminMiddleware);

router.get("/orders", getOrders);
router.put("/orders/:id", updateOrder);

router.get("/products", getProducts);
router.post("/products", addProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);

module.exports = router;
