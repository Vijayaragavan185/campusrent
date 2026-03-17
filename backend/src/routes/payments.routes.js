// backend/src/routes/payments.routes.js
const router = require('express').Router();
const auth = require('../middleware/auth');
const { createPaymentOrder, verifyPayment } = require('../controllers/payments.controller');

// Webhook endpoint - COMMENTED OUT for later
// router.post('/webhook', handleRazorpayWebhook);

router.post('/create-order', auth, createPaymentOrder);
router.post('/verify', auth, verifyPayment);

module.exports = router;
