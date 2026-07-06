const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const prisma = require('../config/db');

async function main() {
  try {
    const products = await prisma.product.findMany({
      include: { variants: true }
    });
    console.log('--- DATABASE PRODUCTS ---');
    products.forEach(p => {
      console.log(`Product: ${p.name}`);
      console.log(`Images:`, p.images);
      console.log(`IsActive:`, p.isActive);
    });
    console.log('-------------------------');
  } catch (error) {
    console.error('Error fetching products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
