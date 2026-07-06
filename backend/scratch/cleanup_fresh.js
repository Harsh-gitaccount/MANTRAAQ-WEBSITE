const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const prisma = require('../config/db');

async function cleanup() {
  console.log('🧹 Starting full database cleanup for fresh testing...\n');

  try {
    // 1. Delete ALL order line items
    const deletedLineItems = await prisma.orderLineItem.deleteMany({});
    console.log(`✅ Deleted ${deletedLineItems.count} order line items.`);

    // 2. Delete ALL orders
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`✅ Deleted ${deletedOrders.count} orders.`);

    // 3. Delete the fake user (ID: 16e258b4-e60b-4e26-824d-f8ff19fe4816)
    const fakeUserId = '16e258b4-e60b-4e26-824d-f8ff19fe4816';
    
    // Delete related records for the fake user first
    await prisma.wishlistItem.deleteMany({ where: { userId: fakeUserId } });
    await prisma.review.deleteMany({ where: { userId: fakeUserId } });
    await prisma.address.deleteMany({ where: { userId: fakeUserId } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: fakeUserId } });

    try {
      await prisma.user.delete({ where: { id: fakeUserId } });
      console.log(`✅ Deleted fake user: ${fakeUserId}`);
    } catch (e) {
      if (e.code === 'P2025') {
        console.log(`⚠️  Fake user ${fakeUserId} not found (already deleted or wrong ID).`);
      } else {
        throw e;
      }
    }

    // 4. Reset coupon usage counts back to 0
    const resetCoupons = await prisma.coupon.updateMany({
      data: { usedCount: 0 },
    });
    console.log(`✅ Reset usedCount on ${resetCoupons.count} coupons.`);

    // 5. Log current stock for reference
    const variants = await prisma.variant.findMany({
      include: { product: { select: { name: true } } },
      orderBy: { product: { name: 'asc' } },
    });
    
    console.log('\n📦 Current variant stock levels:');
    for (const v of variants) {
      console.log(`   ${v.product.name} (${v.title}): ${v.stockQuantity} in stock`);
    }

    console.log('\n🎉 Database cleanup complete! Ready for fresh testing.');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

cleanup();
