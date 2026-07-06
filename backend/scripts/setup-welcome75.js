const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const prisma = require('../config/db');

async function main() {
  console.log('🔄 Cleaning up and configuring coupon tables...');
  try {
    // 1. Delete all existing coupons
    const deleteCount = await prisma.coupon.deleteMany();
    console.log(`🗑️ Deleted ${deleteCount.count} existing coupons from the database.`);

    // 2. Insert WELCOME75 coupon
    const welcome75 = await prisma.coupon.create({
      data: {
        code: 'WELCOME75',
        discountType: 'FIXED',
        discountValue: 75,
        minOrderAmount: 599,
        isActive: true,
        maxUses: null,
        expiresAt: null,
        usedCount: 0
      }
    });

    console.log(`✅ Coupon created successfully: ${welcome75.code}`);
    console.log(`   Discount: ₹${welcome75.discountValue}`);
    console.log(`   Min Order Amount: ₹${welcome75.minOrderAmount}`);
    console.log(`   Applicable to: First-time customers only`);
    
  } catch (error) {
    console.error('❌ Error updating coupons in the database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
