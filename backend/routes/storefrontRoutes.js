const express = require('express');
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const newsletterController = require('../controllers/newsletterController');
const contactController = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { reviewRules } = require('../middleware/validate');

const router = express.Router();

// Product routes (public)
router.get('/products', productController.getProducts);
router.get('/products/search', productController.searchProducts);
router.get('/products/:handle', productController.getProductByHandle);

// Review routes
router.get('/products/:handle/reviews', reviewController.getProductReviews);
router.post('/products/:handle/reviews', protect, reviewRules, reviewController.createReview);
router.delete('/reviews/:id', protect, reviewController.deleteReview);

// Newsletter routes
router.post('/newsletter', newsletterController.subscribe);
router.post('/newsletter/unsubscribe', newsletterController.unsubscribe);

// Contact form routes
router.post('/contact', contactController.submitContact);

module.exports = router;
