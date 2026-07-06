const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const prisma = require('../config/db');

async function cleanDatabase() {
  console.log('🧹 Starting Database Cleanup...');
  
  try {
    // 1. Delete all orders (orderLineItems will cascade delete)
    const ordersDeleted = await prisma.order.deleteMany();
    console.log(`✅ Deleted ${ordersDeleted.count} orders and their order line items.`);

    // 2. Delete all customer users (wishlists, reviews, addresses will cascade delete)
    const customersDeleted = await prisma.user.deleteMany({
      where: { role: 'CUSTOMER' }
    });
    console.log(`✅ Deleted ${customersDeleted.count} customer users and their profiles.`);

    // 3. Clear password reset tokens
    const tokensDeleted = await prisma.passwordResetToken.deleteMany();
    console.log(`✅ Deleted ${tokensDeleted.count} password reset tokens.`);

    console.log('🎉 DATABASE CLEANUP COMPLETE! You can start testing freshly.');
  } catch (err) {
    console.error('❌ Error cleaning database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
