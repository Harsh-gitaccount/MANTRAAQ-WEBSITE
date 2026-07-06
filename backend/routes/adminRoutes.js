const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, restrictTo } = require('../middleware/auth');
const { createProductRules, couponRules, dispatchRules } = require('../middleware/validate');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const newsletterController = require('../controllers/newsletterController');

// Configure multer storage
const uploadDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed.'));
  }
});

const router = express.Router();

// Apply admin access control to all routes below
router.use(protect);
router.use(restrictTo('ADMIN'));

// ─── Dashboard KPIs ─────────────────────────────────────────
router.get('/metrics', orderController.getDashboardMetrics);

// ─── Product Management ─────────────────────────────────────
router.get('/products', productController.adminGetProducts);
router.post('/products', createProductRules, productController.createProduct);
router.put('/products/reorder', productController.reorderProducts);
router.post('/products/upload-images', upload.array('images', 10), productController.uploadProductImages);
router.get('/products/:id', productController.adminGetProductById);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.patch('/products/:id/toggle-status', productController.toggleProductStatus);

// ─── Order Management ───────────────────────────────────────
router.get('/orders', orderController.getAdminOrders);
router.get('/orders/:id', orderController.getAdminOrderById);
router.put('/orders/:id/dispatch', dispatchRules, orderController.dispatchOrder);
router.put('/orders/:id/deliver', orderController.deliverOrder);
router.put('/orders/:id/cancel', orderController.adminCancelOrder);
router.put('/orders/:id/address', orderController.updateOrderAddress);

// ─── Customer Management ────────────────────────────────────
router.get('/customers', orderController.getCustomers);
router.get('/customers/:id', orderController.getCustomerById);

// ─── Coupon Management ──────────────────────────────────────
router.get('/coupons', couponController.listCoupons);
router.post('/coupons', couponRules, couponController.createCoupon);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

// ─── Newsletter Subscribers ─────────────────────────────────
router.get('/newsletter-subscribers', newsletterController.adminGetSubscribers);

module.exports = router;
