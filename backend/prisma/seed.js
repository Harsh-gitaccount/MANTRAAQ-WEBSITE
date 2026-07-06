require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up in proper dependency order
  console.log('Cleaning existing data...');
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.orderLineItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.address.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany();

  // ─── 1. Create Admin User ──────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mantraaq.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  const salt = await bcrypt.genSalt(12);
  const adminHash = await bcrypt.hash(adminPassword, salt);

  const admin = await prisma.user.create({
    data: {
      name: 'MantraAQ Admin',
      email: adminEmail,
      passwordHash: adminHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // ─── 2. Create Products ────────────────────────────────
  const products = [
    {
      name: 'Singhara Pasta Macaroni',
      description: 'Delicious gluten-free pasta made from water chestnut (singhara) flour. Perfect for health-conscious food lovers who don\'t want to compromise on taste. Rich in nutrients and easy to cook.',
      handle: 'singhara-pasta-macaroni',
      category: 'Pasta & Noodles',
      tags: ['gluten-free', 'pasta', 'singhara', 'healthy'],
      images: [],
      isActive: true,
      variants: [
        { title: '250g', price: 149, compareAtPrice: 199, stockQuantity: 50, sku: 'SPM-250' },
        { title: '500g', price: 249, compareAtPrice: 349, stockQuantity: 30, sku: 'SPM-500' },
      ],
    },
    {
      name: 'Singhara Vermicelli',
      description: 'Premium singhara (water chestnut) vermicelli — thin, delicate, and perfect for sweet or savory dishes. A healthier alternative to regular wheat vermicelli. Ideal for upma, payasam, and kheer.',
      handle: 'singhara-vermicell',
      category: 'Pasta & Noodles',
      tags: ['gluten-free', 'vermicelli', 'singhara', 'healthy'],
      images: [],
      isActive: true,
      variants: [
        { title: '250g', price: 129, compareAtPrice: 179, stockQuantity: 40, sku: 'SV-250' },
        { title: '500g', price: 229, compareAtPrice: 299, stockQuantity: 25, sku: 'SV-500' },
      ],
    },
    {
      name: 'Singhara Atta',
      description: 'Stone-ground singhara (water chestnut) flour, a traditional fasting-friendly flour used in Indian households. Perfect for making puris, rotis, and halwa during Navratri and other fasting occasions.',
      handle: 'singhara-atta',
      category: 'Flour & Atta',
      tags: ['gluten-free', 'atta', 'singhara', 'fasting', 'navratri'],
      images: [],
      isActive: true,
      variants: [
        { title: '500g', price: 199, compareAtPrice: 249, stockQuantity: 60, sku: 'SA-500' },
        { title: '1kg', price: 349, compareAtPrice: 449, stockQuantity: 35, sku: 'SA-1KG' },
      ],
    },
    {
      name: 'Fresh Singhara',
      description: 'Farm-fresh water chestnuts (singhara) harvested from premium wetlands. Crunchy, sweet, and loaded with vitamins and minerals. Perfect for snacking raw or adding to salads and curries.',
      handle: 'fresh-singhara',
      category: 'Fresh Produce',
      tags: ['fresh', 'singhara', 'raw', 'seasonal'],
      images: [],
      isActive: true,
      variants: [
        { title: '500g', price: 99, compareAtPrice: 149, stockQuantity: 100, sku: 'FS-500' },
        { title: '1kg', price: 179, compareAtPrice: 249, stockQuantity: 75, sku: 'FS-1KG' },
      ],
    },
    {
      name: 'Dry Singhara',
      description: 'Sun-dried singhara (water chestnut) chips — a crunchy and nutritious snack. Can be used for making atta at home or enjoyed as a ready-to-eat snack. Long shelf life, easy to store.',
      handle: 'dry-singhara',
      category: 'Dry Snacks',
      tags: ['dried', 'singhara', 'snack', 'chips'],
      images: [],
      isActive: true,
      variants: [
        { title: '250g', price: 149, compareAtPrice: 199, stockQuantity: 45, sku: 'DS-250' },
        { title: '500g', price: 269, compareAtPrice: 349, stockQuantity: 30, sku: 'DS-500' },
      ],
    },
    {
      name: 'Singhara Snacks',
      description: 'Assorted singhara-based snacks — a tasty and healthy option for evening munchies. Made from real singhara flour with traditional spices. Fasting-friendly and full of crunch.',
      handle: 'singhara-snacks',
      category: 'Dry Snacks',
      tags: ['snacks', 'singhara', 'fasting', 'ready-to-eat'],
      images: [],
      isActive: true,
      variants: [
        { title: '200g', price: 129, compareAtPrice: 169, stockQuantity: 55, sku: 'SS-200' },
        { title: '400g', price: 229, compareAtPrice: 299, stockQuantity: 35, sku: 'SS-400' },
      ],
    },
  ];

  for (const product of products) {
    const { variants, ...productData } = product;
    const created = await prisma.product.create({
      data: {
        ...productData,
        variants: {
          create: variants,
        },
      },
      include: { variants: true },
    });
    console.log(`✅ Product created: ${created.name} (${created.variants.length} variants)`);
  }

  // ─── 3. Create Sample Coupons ──────────────────────────
  const coupons = [
    {
      code: 'WELCOME75',
      discountType: 'FIXED',
      discountValue: 75,
      minOrderAmount: 599,
      maxUses: null,
      isActive: true,
      expiresAt: null,
    },
  ];

  for (const coupon of coupons) {
    const created = await prisma.coupon.create({ data: coupon });
    console.log(`✅ Coupon created: ${created.code} (${created.discountType} ${created.discountValue}${created.discountType === 'PERCENTAGE' ? '%' : '₹'})`);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log(`   Admin login: ${adminEmail} / ${adminPassword}`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Coupons: ${coupons.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
