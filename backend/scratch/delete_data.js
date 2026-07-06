require('dotenv').config();
const prisma = require('../config/db');

async function main() {
  console.log('Starting data cleanup...');
  
  // 1. Delete all Orders (this will cascade delete OrderLineItems due to onDelete: Cascade)
  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`Deleted ${deletedOrders.count} orders and their line items.`);

  // 2. Delete all Users with role CUSTOMER (preserving ADMINs)
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: 'CUSTOMER',
    },
  });
  console.log(`Deleted ${deletedUsers.count} customer users. Admin users were preserved.`);

  console.log('Cleanup completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
