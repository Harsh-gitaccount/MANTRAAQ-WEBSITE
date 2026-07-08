require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Ensure IPv4 prioritization for network lookups

const prisma = require('../config/db');

async function main() {
  console.log('🚀 Updating existing COD orders with status PAID to PENDING...');
  
  // 1. Find the target COD orders
  const codOrders = await prisma.order.findMany({
    where: {
      status: 'PAID',
      OR: [
        { payuTxnId: { startsWith: 'cod_' } },
        { paymentId: { startsWith: 'cod_' } }
      ]
    }
  });
  
  console.log(`📝 Found ${codOrders.length} COD orders with status PAID.`);
  
  if (codOrders.length === 0) {
    console.log('✨ No matching orders found to update.');
    return;
  }
  
  // 2. Update their status to PENDING
  const result = await prisma.order.updateMany({
    where: {
      status: 'PAID',
      OR: [
        { payuTxnId: { startsWith: 'cod_' } },
        { paymentId: { startsWith: 'cod_' } }
      ]
    },
    data: {
      status: 'PENDING'
    }
  });
  
  console.log(`✅ Successfully updated ${result.count} existing COD orders to PENDING status.`);
}

main()
  .catch(e => {
    console.error('❌ Error executing update:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
