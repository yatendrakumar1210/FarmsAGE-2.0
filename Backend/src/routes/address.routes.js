const express = require('express');
const router = express.Router();

const { saveAddress } = require("../controller/address.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/save-address" , authMiddleware , saveAddress);

module.exports = router;