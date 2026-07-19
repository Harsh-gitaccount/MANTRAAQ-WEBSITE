const { validationResult } = require('express-validator');
const prisma = require('../config/db');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// ─── Storefront (Public) ────────────────────────────────────

exports.getProducts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          variants: { orderBy: { price: 'asc' } },
          reviews: { select: { rating: true } },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    // Add average rating to each product
    const productsWithRating = products.map(p => {
      const ratings = p.reviews.map(r => r.rating);
      const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : null;
      const { reviews, ...productData } = p;
      return { ...productData, avgRating: avgRating ? parseFloat(avgRating) : null, reviewCount: ratings.length };
    });

    res.status(200).json({ success: true, count: totalCount, products: productsWithRating });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
};

exports.getProductByHandle = async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { handle: req.params.handle, isActive: true },
      include: {
        variants: { orderBy: { price: 'asc' } },
        reviews: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const ratings = product.reviews.map(r => r.rating);
    const avgRating = ratings.length > 0
      ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
      : null;

    res.status(200).json({ success: true, product: { ...product, avgRating, reviewCount: ratings.length } });
  } catch (error) {
    console.error('Get product by handle error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product.' });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { variants: { orderBy: { price: 'asc' } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 20,
    });

    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
};

// ─── Admin ──────────────────────────────────────────────────

exports.adminGetProducts = async (req, res) => {
  try {
    const { search, category, isActive, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { handle: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { variants: { orderBy: { price: 'asc' } } },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    res.status(200).json({ success: true, count: totalCount, products });
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
};

exports.adminGetProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        variants: { orderBy: { price: 'asc' } },
        reviews: { include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Admin get product error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product.' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, handle, images, category, tags, variants } = req.body;

    // Slugify handle
    const slug = (handle || name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check uniqueness
    const existing = await prisma.product.findUnique({ where: { handle: slug } });
    if (existing) {
      return res.status(409).json({ success: false, message: `A product with handle "${slug}" already exists.` });
    }

    const product = await prisma.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          name,
          description: description || '',
          handle: slug,
          images: images || [],
          category: category || null,
          tags: tags || [],
          sortOrder: req.body.sortOrder !== undefined ? parseInt(req.body.sortOrder) : 0,
          variants: {
            create: variants.map(v => ({
              title: v.title,
              price: parseFloat(v.price),
              compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
              stockQuantity: parseInt(v.stockQuantity) || 0,
              sku: v.sku || null,
            })),
          },
        },
        include: { variants: true },
      });
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, handle, images, category, tags, isActive, variants } = req.body;

    const existing = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check handle uniqueness against other products
    if (handle && handle !== existing.handle) {
      const slug = handle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const conflict = await prisma.product.findFirst({
        where: { handle: slug, id: { not: id } },
      });
      if (conflict) {
        return res.status(409).json({ success: false, message: `Handle "${slug}" is already in use.` });
      }
    }

    const product = await prisma.$transaction(async (tx) => {
      // Handle variant upsert logic
      if (variants && Array.isArray(variants)) {
        const incomingIds = variants.filter(v => v.id).map(v => v.id);
        const toDelete = existing.variants.filter(v => !incomingIds.includes(v.id));

        // Delete removed variants (only if not referenced in orders)
        for (const v of toDelete) {
          const refCount = await tx.orderLineItem.count({ where: { variantId: v.id } });
          if (refCount === 0) {
            await tx.variant.delete({ where: { id: v.id } });
          }
        }

        // Upsert variants
        for (const v of variants) {
          if (v.id) {
            await tx.variant.update({
              where: { id: v.id },
              data: {
                title: v.title,
                price: parseFloat(v.price),
                compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
                stockQuantity: parseInt(v.stockQuantity) || 0,
                sku: v.sku || null,
              },
            });
          } else {
            await tx.variant.create({
              data: {
                productId: id,
                title: v.title,
                price: parseFloat(v.price),
                compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
                stockQuantity: parseInt(v.stockQuantity) || 0,
                sku: v.sku || null,
              },
            });
          }
        }
      }

      return tx.product.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(handle && { handle: handle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }),
          ...(images && { images }),
          ...(category !== undefined && { category }),
          ...(tags && { tags }),
          ...(isActive !== undefined && { isActive }),
          ...(req.body.sortOrder !== undefined && { sortOrder: parseInt(req.body.sortOrder) }),
        },
        include: { variants: { orderBy: { price: 'asc' } } },
      });
    });

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: { select: { id: true } } },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check if any variant is referenced in order line items
    const variantIds = product.variants.map(v => v.id);
    const orderRefCount = await prisma.orderLineItem.count({
      where: { variantId: { in: variantIds } },
    });

    if (orderRefCount > 0) {
      // Soft delete
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return res.status(200).json({ success: true, message: 'Product deactivated (has order references).' });
    }

    // Hard delete
    await prisma.product.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Product deleted permanently.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};

exports.toggleProductStatus = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: !product.isActive },
    });

    res.status(200).json({ success: true, product: updated, message: `Product ${updated.isActive ? 'activated' : 'deactivated'}.` });
  } catch (error) {
    console.error('Toggle product status error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle product status.' });
  }
};

exports.reorderProducts = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array is required.' });
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.product.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    res.status(200).json({ success: true, message: 'Products reordered successfully.' });
  } catch (error) {
    console.error('Reorder products error:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder products.' });
  }
};

exports.uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    const uploadPromises = req.files.map(async (file) => {
      // Upload to Cloudinary under folder 'mantraaq/products'
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'mantraaq/products',
      });
      // Delete the file from the local temp disk storage
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err) {
        console.error('Failed to delete temp file:', file.path, err);
      }
      return result.secure_url;
    });

    const urls = await Promise.all(uploadPromises);
    res.status(200).json({ success: true, urls });
  } catch (error) {
    console.error('Upload product images error:', error);
    // Cleanup any uploaded files from disk in case of error
    if (req.files) {
      req.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (err) {
          console.error('Cleanup temp file error:', err);
        }
      });
    }
    res.status(500).json({ success: false, message: 'Failed to upload images to Cloudinary.' });
  }
};
