const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
  createOrder,
  verifyPayment,
  codOrder,
  getMyOrders,
  handleWebhook,
  cancelOrder,
} = require('../controller/order.controller');

router.post('/create', authMiddleware, createOrder);
router.post('/verify-payment', authMiddleware, verifyPayment);
router.post('/cod', authMiddleware, codOrder);
router.get('/get-order', authMiddleware, getMyOrders);
router.put('/:id/cancel', authMiddleware, cancelOrder);
router.post('/webhook', handleWebhook);

module.exports = router;