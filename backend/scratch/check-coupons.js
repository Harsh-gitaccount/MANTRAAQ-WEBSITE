const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const prisma = require('../config/db');

async function main() {
  try {
    const coupons = await prisma.coupon.findMany();
    console.log('--- DATABASE COUPONS ---');
    console.log(JSON.stringify(coupons, null, 2));
    console.log('------------------------');
  } catch (error) {
    console.error('Error fetching coupons:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
