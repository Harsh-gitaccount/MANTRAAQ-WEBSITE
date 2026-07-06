const express = require('express');
const checkoutController = require('../controllers/checkoutController');
const { protect, optionalProtect } = require('../middleware/auth');
const { checkoutRules } = require('../middleware/validate');

const router = express.Router();

// Checkout REQUIRES authentication — no guest orders allowed
router.post('/create-payment-order', protect, checkoutRules, checkoutController.createPaymentOrder);
router.post('/verify-payment', checkoutController.verifyPayment);
router.post('/validate-coupon', optionalProtect, checkoutController.validateCoupon);
router.get('/active-coupons', checkoutController.getActiveCoupons);
router.post('/payu-success', checkoutController.payuSuccess);
router.post('/payu-failure', checkoutController.payuFailure);

module.exports = router;
