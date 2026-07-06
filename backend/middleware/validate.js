const { body } = require('express-validator');

// ─── Auth Validation Rules ──────────────────────────────────

exports.registerRules = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

exports.loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

exports.forgotPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
];

exports.resetPasswordRules = [
  body('token').notEmpty().withMessage('Reset token is required.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

exports.updateProfileRules = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters.'),
  body('phone').optional().trim().matches(/^[0-9]{10}$/).withMessage('Phone must be exactly 10 digits.'),
];

exports.changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
];

// ─── Product Validation Rules ───────────────────────────────

exports.createProductRules = [
  body('name').notEmpty().trim().withMessage('Product name is required.'),
  body('handle').optional().trim().matches(/^[a-z0-9-]+$/).withMessage('Handle must be lowercase alphanumeric with hyphens.'),
  body('variants').isArray({ min: 1 }).withMessage('At least one variant is required.'),
  body('variants.*.title').notEmpty().withMessage('Variant title is required.'),
  body('variants.*.price').isFloat({ min: 0 }).withMessage('Variant price must be >= 0.'),
];

// ─── Checkout Validation Rules ──────────────────────────────

exports.checkoutRules = [
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array.'),
  body('items.*.variantId').isString().notEmpty().withMessage('Each item must have a variantId.'),
  body('items.*.quantity').isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1 and 100.'),
  body('shippingAddress').isObject().withMessage('Shipping address is required.'),
  body('shippingAddress.name').isString().notEmpty().withMessage('Shipping name is required.'),
  body('shippingAddress.email').isEmail().withMessage('Shipping email must be valid.'),
  body('shippingAddress.phone').isString().notEmpty().withMessage('Shipping phone is required.'),
  body('shippingAddress.street').isString().notEmpty().withMessage('Street address is required.'),
  body('shippingAddress.city').isString().notEmpty().withMessage('City is required.'),
  body('shippingAddress.state').isString().notEmpty().withMessage('State is required.'),
  body('shippingAddress.postalCode').isString().notEmpty().withMessage('Postal code is required.'),
  body('couponCode').optional({ nullable: true, checkFalsy: true }).isString().withMessage('Coupon code must be a string.'),
  body('paymentMethod').optional().isIn(['ONLINE', 'COD']).withMessage('Payment method must be ONLINE or COD.'),
];

// ─── Coupon Validation Rules ────────────────────────────────

exports.couponRules = [
  body('code').notEmpty().trim().withMessage('Coupon code is required.'),
  body('discountType').isIn(['PERCENTAGE', 'FIXED']).withMessage('Discount type must be PERCENTAGE or FIXED.'),
  body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be >= 0.'),
  body('minOrderAmount').optional({ nullable: true }).isFloat({ min: 0 }),
  body('maxUses').optional({ nullable: true }).isInt({ min: 1 }),
  body('expiresAt').optional({ nullable: true }).isISO8601().withMessage('Expiry date must be valid ISO 8601.'),
];

// ─── Review Validation Rules ────────────────────────────────

exports.reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment must be under 1000 characters.'),
];

// ─── Order Validation Rules ─────────────────────────────────

exports.dispatchRules = [
  body('trackingNumber').notEmpty().trim().withMessage('Tracking number is required.'),
  body('trackingCarrier').optional().trim(),
];
