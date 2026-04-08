const express = require("express");
const router = express.Router();
const {
  getOrders,
  updateOrder,
  addProduct,
  updateProduct,
  deleteProduct,
  getUsers,
} = require("../controller/admin.controller");


const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");


router.use(authMiddleware , adminMiddleware);

router.get("/orders", getOrders);
router.put("/orders/:id", updateOrder);

router.post("/products", addProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/users", getUsers);

module.exports = router;
