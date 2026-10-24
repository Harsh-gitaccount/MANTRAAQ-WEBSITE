const express = require('express');
const trackingController = require('../controllers/trackingController');

const router = express.Router();

// Public: the storefront reports funnel steps and checkout details
router.post('/event', trackingController.trackEvent);
router.post('/checkout', trackingController.trackCheckout);

module.exports = router;
