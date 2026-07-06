const { validationResult } = require('express-validator');
const prisma = require('../config/db');

exports.getProductReviews = async (req, res) => {
  try {
    const { handle } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const product = await prisma.product.findFirst({ where: { handle } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { productId: product.id },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.review.count({ where: { productId: product.id } }),
    ]);

    // Calculate average rating
    const allRatings = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
    });

    res.status(200).json({
      success: true,
      reviews,
      totalCount,
      avgRating: allRatings._avg.rating ? parseFloat(allRatings._avg.rating.toFixed(1)) : null,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
};

exports.createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { handle } = req.params;
    const { rating, comment } = req.body;

    const product = await prisma.product.findFirst({ where: { handle } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check if user has purchased this product
    const hasPurchased = await prisma.orderLineItem.findFirst({
      where: {
        order: {
          userId: req.user.id,
          status: { in: ['PAID', 'DISPATCHED', 'DELIVERED'] },
        },
        variant: { productId: product.id },
      },
    });

    if (!hasPurchased) {
      return res.status(403).json({ success: false, message: 'You can only review products you have purchased.' });
    }

    // Check for existing review (unique constraint will also catch this)
    const existingReview = await prisma.review.findUnique({
      where: { userId_productId: { userId: req.user.id, productId: product.id } },
    });

    if (existingReview) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        productId: product.id,
        rating: parseInt(rating),
        comment: comment?.trim() || null,
      },
      include: { user: { select: { name: true } } },
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Failed to create review.' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Only author or admin can delete
    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'You can only delete your own reviews.' });
    }

    await prisma.review.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete review.' });
  }
};
