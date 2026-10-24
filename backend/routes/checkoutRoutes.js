const express = require('express');
const checkoutController = require('../controllers/checkoutController');
const { optionalProtect } = require('../middleware/auth');
const { checkoutRules } = require('../middleware/validate');

const router = express.Router();

// Guests can check out; a logged-in customer's order is saved to their account
router.post('/create-payment-order', optionalProtect, checkoutRules, checkoutController.createPaymentOrder);
router.get('/guest-order/:id', checkoutController.getGuestOrder);
router.post('/guest-order/:id/cancel', checkoutController.cancelGuestOrder);
router.post('/verify-payment', checkoutController.verifyPayment);
router.post('/validate-coupon', optionalProtect, checkoutController.validateCoupon);
router.get('/active-coupons', checkoutController.getActiveCoupons);
router.post('/payu-success', checkoutController.payuSuccess);
router.post('/payu-failure', checkoutController.payuFailure);
router.post('/resend-confirmation/:id', checkoutController.resendOrderConfirmation);
router.post('/admin-alert/:id', checkoutController.sendAdminAlertForOrder);

module.exports = router;
