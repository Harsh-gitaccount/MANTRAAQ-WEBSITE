require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Ensure IPv4 prioritization for network lookups

const prisma = require('../config/db');

async function main() {
  console.log('🚀 Starting Supabase testing records cleanup...');
  
  // 1. Delete all Password Reset Tokens
  const deletedTokens = await prisma.passwordResetToken.deleteMany({});
  console.log(`🧹 Deleted ${deletedTokens.count} PasswordResetTokens.`);

  // 2. Delete all Orders (Prisma relations automatically CASCADE delete OrderLineItems)
  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`🧹 Deleted ${deletedOrders.count} Orders.`);

  // 3. Delete all Wishlist Items
  const deletedWishlist = await prisma.wishlistItem.deleteMany({});
  console.log(`🧹 Deleted ${deletedWishlist.count} WishlistItems.`);

  // 4. Delete all Reviews
  const deletedReviews = await prisma.review.deleteMany({});
  console.log(`🧹 Deleted ${deletedReviews.count} Reviews.`);

  // 5. Delete all Addresses for CUSTOMER users
  const deletedAddresses = await prisma.address.deleteMany({
    where: {
      user: {
        role: 'CUSTOMER'
      }
    }
  });
  console.log(`🧹 Deleted ${deletedAddresses.count} customer Addresses.`);

  // 6. Delete all Users with CUSTOMER role (ADMIN users are preserved)
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: 'CUSTOMER'
    }
  });
  console.log(`🧹 Deleted ${deletedUsers.count} CUSTOMER users.`);

  // 7. Delete all Newsletter Subscribers
  const deletedSubscribers = await prisma.newsletterSubscriber.deleteMany({});
  console.log(`🧹 Deleted ${deletedSubscribers.count} NewsletterSubscribers.`);

  console.log('✨ Cleanup finished successfully! Admin accounts, products, and categories have been preserved.');
}

main()
  .catch(e => {
    console.error('❌ Error executing database cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
