const { validationResult } = require('express-validator');
const prisma = require('../config/db');

// ─── listCoupons ─────────────────────────────────────────────────────────────

/**
 * Paginated list of all coupons.
 * GET /api/admin/coupons?page=1&limit=20
 */
exports.listCoupons = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coupon.count(),
    ]);

    res.status(200).json({
      success: true,
      data: coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List Coupons Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch coupons.',
    });
  }
};

// ─── createCoupon ────────────────────────────────────────────────────────────

/**
 * Create a new coupon.
 * POST /api/admin/coupons
 */
exports.createCoupon = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxUses,
      isActive,
      expiresAt,
    } = req.body;

    const normalizedCode = code.trim().toUpperCase();

    // Check uniqueness
    const existing = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Coupon code "${normalizedCode}" already exists.`,
      });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        discountType,
        discountValue,
        minOrderAmount: minOrderAmount ?? null,
        maxUses: maxUses ?? null,
        isActive: isActive !== undefined ? isActive : true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    console.error('Create Coupon Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create coupon.',
    });
  }
};

// ─── updateCoupon ────────────────────────────────────────────────────────────

/**
 * Update an existing coupon by ID.
 * PUT /api/admin/coupons/:id
 */
exports.updateCoupon = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: 'Coupon not found.' });
    }

    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxUses,
      isActive,
      expiresAt,
    } = req.body;

    // Build update payload (only provided fields)
    const data = {};
    if (code !== undefined) {
      const normalizedCode = code.trim().toUpperCase();
      // Ensure new code isn't taken by another coupon
      if (normalizedCode !== existing.code) {
        const duplicate = await prisma.coupon.findUnique({
          where: { code: normalizedCode },
        });
        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: `Coupon code "${normalizedCode}" already exists.`,
          });
        }
      }
      data.code = normalizedCode;
    }
    if (discountType !== undefined) data.discountType = discountType;
    if (discountValue !== undefined) data.discountValue = discountValue;
    if (minOrderAmount !== undefined) data.minOrderAmount = minOrderAmount;
    if (maxUses !== undefined) data.maxUses = maxUses;
    if (isActive !== undefined) data.isActive = isActive;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const coupon = await prisma.coupon.update({ where: { id }, data });

    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    console.error('Update Coupon Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update coupon.',
    });
  }
};

// ─── deleteCoupon ────────────────────────────────────────────────────────────

/**
 * Delete a coupon by ID.
 * DELETE /api/admin/coupons/:id
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: 'Coupon not found.' });
    }

    await prisma.coupon.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Coupon Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete coupon.',
    });
  }
};
