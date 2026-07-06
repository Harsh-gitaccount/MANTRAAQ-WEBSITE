require('dotenv').config();
const prisma = require('../config/db');

async function main() {
  console.log('Looking for PENDING orders to clean up...');
  
  const pendingOrders = await prisma.order.findMany({
    where: { status: 'PENDING' },
    include: { orderLineItems: true },
  });

  console.log(`Found ${pendingOrders.length} PENDING order(s).`);

  for (const order of pendingOrders) {
    await prisma.$transaction(async (tx) => {
      // Restore stock for each line item
      for (const item of order.orderLineItems) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }

      // Mark order as CANCELLED
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          notes: 'Manual cleanup: cancelled stale PENDING order from failed payment attempt.',
        },
      });
    });

    console.log(`  Cancelled order #${order.id} (txn: ${order.payuTxnId || 'N/A'}), restored stock for ${order.orderLineItems.length} item(s).`);
  }

  console.log('Cleanup complete.');
}

main()
  .catch((err) => console.error('Cleanup error:', err))
  .finally(() => prisma.$disconnect());
