const prisma = require('../config/db');

exports.getWishlist = async (req, res) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            variants: { orderBy: { price: 'asc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const wishlist = items
      .filter(item => item.product.isActive)
      .map(item => ({
        id: item.id,
        productId: item.product.id,
        name: item.product.name,
        handle: item.product.handle,
        image: item.product.images[0] || null,
        price: item.product.variants[0]?.price || 0,
        compareAtPrice: item.product.variants[0]?.compareAtPrice || null,
        addedAt: item.createdAt,
      }));

    res.status(200).json({ success: true, wishlist });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist.' });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Upsert prevents duplicates
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: {},
      create: { userId: req.user.id, productId },
    });

    res.status(200).json({ success: true, message: 'Added to wishlist.' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to add to wishlist.' });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user.id, productId },
    });

    res.status(200).json({ success: true, message: 'Removed from wishlist.' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist.' });
  }
};

exports.checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const item = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    });

    res.status(200).json({ success: true, inWishlist: !!item });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to check wishlist.' });
  }
};
