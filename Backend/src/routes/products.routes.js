const express = require("express");
const router = express.Router();
const { getPublicProducts } = require("../controller/admin.controller");

// Public route — no auth needed
// GET /api/products?category=Fruits
router.get("/", getPublicProducts);

module.exports = router;
