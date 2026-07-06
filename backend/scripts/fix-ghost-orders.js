/**
 * Fix Ghost Orders Script
 * 
 * Cancels all PENDING orders with userId=null (ghost orders created
 * by unauthenticated checkout bug), restores their reserved stock,
 * and logs the results.
 * 
 * Usage: node backend/scripts/fix-ghost-orders.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../config/db');

async function fixGhostOrders() {
  console.log('🔍 Scanning for ghost orders (PENDING with userId=null)...\n');

  // Find all PENDING orders with null userId
  const ghostOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      userId: null,
    },
    include: {
      orderLineItems: {
        include: {
          variant: { include: { product: { select: { name: true } } } },
        },
      },
    },
  });

  if (ghostOrders.length === 0) {
    console.log('✅ No ghost orders found.\n');
  } else {
    console.log(`⚠️  Found ${ghostOrders.length} ghost order(s):\n`);

    for (const order of ghostOrders) {
      console.log(`  Order: ${order.id}`);
      console.log(`  Created: ${order.createdAt}`);
      console.log(`  Amount: ₹${order.totalAmount}`);
      console.log(`  Items:`);
      for (const item of order.orderLineItems) {
        console.log(`    - ${item.productName} (${item.variantTitle}) x${item.quantity}`);
      }
      console.log('');

      // Restore stock and cancel order in a transaction
      await prisma.$transaction(async (tx) => {
        for (const item of order.orderLineItems) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
          console.log(`    ✅ Restored ${item.quantity} unit(s) to variant ${item.variantTitle}`);
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            notes: 'Auto-cancelled: Ghost order created without authentication.',
          },
        });
      });

      console.log(`  ✅ Order ${order.id} cancelled and stock restored.\n`);
    }
  }

  // Also clean up ANY remaining PENDING orders older than 30 min
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const stalePending = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoff },
    },
    include: { orderLineItems: true },
  });

  if (stalePending.length > 0) {
    console.log(`\n🧹 Found ${stalePending.length} stale PENDING order(s) older than 30 min:\n`);

    for (const order of stalePending) {
      await prisma.$transaction(async (tx) => {
        for (const item of order.orderLineItems) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            notes: 'Auto-cancelled: Abandoned/stale PENDING order.',
          },
        });
      });

      console.log(`  ✅ Order ${order.id} cancelled and stock restored.`);
    }
  } else {
    console.log('✅ No stale PENDING orders found.');
  }

  // Print current stock levels for all products
  console.log('\n📦 Current Stock Levels:');
  console.log('─'.repeat(60));
  const products = await prisma.product.findMany({
    include: { variants: { orderBy: { price: 'asc' } } },
    orderBy: { name: 'asc' },
  });

  for (const p of products) {
    console.log(`\n  ${p.name} (${p.isActive ? '🟢 Active' : '🔴 Hidden'})`);
    for (const v of p.variants) {
      const stockColor = v.stockQuantity === 0 ? '❌' : v.stockQuantity <= 3 ? '⚠️' : '✅';
      console.log(`    ${stockColor} ${v.title}: ${v.stockQuantity} units`);
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log('🎉 Database cleanup complete!\n');
}

fixGhostOrders()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
