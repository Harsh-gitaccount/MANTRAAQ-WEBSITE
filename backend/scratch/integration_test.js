const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const prisma = require('../config/db');

// Config
const API_BASE = 'http://localhost:5000/api';
const testEmail = `test_customer_${Math.floor(Math.random() * 100000)}@example.com`;
const testPassword = 'Password123!';
const newPassword = 'NewPassword123!';
const resetPasswordVal = 'ResetPassword123!';
let customerToken = null;
let adminToken = null;
let testUserId = null;
let testVariantId = null;
let testProductId = null;
let testPayuTxnId = null;
let testOrderId = null;

async function runTests() {
  console.log('🚀 STARTING COMPREHENSIVE BACKEND API INTEGRATION TESTING...\n');

  try {
    // ----------------------------------------------------
    // Scenario 1: Customer Registration
    // ----------------------------------------------------
    console.log('📝 Scenario 1: Registering Test Customer...');
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Tester',
        email: testEmail,
        password: testPassword
      })
    });
    
    const registerData = await registerRes.json();
    if (registerRes.status !== 201 || !registerData.success) {
      throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
    }
    testUserId = registerData.user.id;
    console.log(`✅ Customer Registered successfully! ID: ${testUserId}\n`);

    // ----------------------------------------------------
    // Scenario 2: Customer Login & Profile Fetch
    // ----------------------------------------------------
    console.log('🔑 Scenario 2: Customer Login...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    customerToken = loginData.token;
    console.log('✅ Login successful! Token acquired.');

    // Fetch Profile
    const profileRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const profileData = await profileRes.json();
    if (!profileData.success || profileData.user.name !== 'Automated Tester') {
      throw new Error(`Profile fetch failed: ${JSON.stringify(profileData)}`);
    }
    console.log('✅ Profile verification successful.\n');

    // ----------------------------------------------------
    // Scenario 3: Profile Edit & Change Password
    // ----------------------------------------------------
    console.log('✏️ Scenario 3: Editing Profile & Changing Password...');
    
    // Edit Profile
    const editRes = await fetch(`${API_BASE}/auth/update-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        name: 'Tester Updated',
        phone: '9876543210'
      })
    });
    const editData = await editRes.json();
    if (!editData.user || editData.user.phone !== '9876543210') {
      throw new Error(`Profile update failed: ${JSON.stringify(editData)}`);
    }
    console.log('✅ Profile Update successful.');

    // Change Password
    const changePassRes = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        currentPassword: testPassword,
        newPassword: newPassword
      })
    });
    const changePassData = await changePassRes.json();
    if (!changePassData.success) {
      throw new Error(`Change password failed: ${JSON.stringify(changePassData)}`);
    }
    console.log('✅ Change password successful. Testing new login credentials...');

    // Verify Login with New Password
    const loginNewRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: newPassword
      })
    });
    const loginNewData = await loginNewRes.json();
    if (loginNewRes.status !== 200 || !loginNewData.token) {
      throw new Error(`Login with new password failed.`);
    }
    customerToken = loginNewData.token;
    console.log('✅ Re-login with new password successful.\n');

    // ----------------------------------------------------
    // Scenario 4: Forgot & Reset Password Flow
    // ----------------------------------------------------
    console.log('📧 Scenario 4: Testing Forgot & Reset Password flow...');
    
    // Trigger forgot password
    const forgotRes = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const forgotData = await forgotRes.json();
    if (!forgotData.success) {
      throw new Error(`Forgot password trigger failed: ${JSON.stringify(forgotData)}`);
    }

    // Retrieve token from database
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: testUserId, used: false },
      orderBy: { createdAt: 'desc' }
    });

    if (!tokenRecord) {
      throw new Error('Password reset token record was not created in the database.');
    }
    console.log(`✅ Forgot password triggered. Token found: ${tokenRecord.token}`);

    // Call reset password endpoint
    const resetRes = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: tokenRecord.token,
        password: resetPasswordVal
      })
    });
    const resetData = await resetRes.json();
    if (!resetData.success) {
      throw new Error(`Password reset endpoint call failed: ${JSON.stringify(resetData)}`);
    }
    console.log('✅ Reset password endpoint call successful. Testing re-login...');

    // Re-login with reset password
    const loginResetRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: resetPasswordVal
      })
    });
    const loginResetData = await loginResetRes.json();
    if (loginResetRes.status !== 200 || !loginResetData.token) {
      throw new Error(`Login with reset password failed.`);
    }
    customerToken = loginResetData.token;
    console.log('✅ Login with reset password successful.\n');

    // ----------------------------------------------------
    // Scenario 5: Storefront Product Browsing & Search
    // ----------------------------------------------------
    console.log('🥣 Scenario 5: Storefront product browsing & search...');
    
    // Fetch Products
    const productsRes = await fetch(`${API_BASE}/storefront/products`);
    const productsData = await productsRes.json();
    if (!productsData.success || !productsData.products.length) {
      throw new Error('Failed to fetch storefront products or product array is empty.');
    }
    console.log(`✅ Loaded ${productsData.products.length} storefront products.`);

    // Choose first product and variant for checkout testing
    const testProduct = productsData.products[0];
    testProductId = testProduct.id;
    testVariantId = testProduct.variants[0].id;
    console.log(`👉 Selected Test Product: "${testProduct.name}", Variant ID: ${testVariantId}`);

    // Test Search
    const searchRes = await fetch(`${API_BASE}/storefront/products/search?q=${encodeURIComponent(testProduct.name)}`);
    const searchData = await searchRes.json();
    if (!searchData.success || !searchData.products.length) {
      throw new Error('Search query returned empty results.');
    }
    console.log(`✅ Product Search successfully matched: "${searchData.products[0].name}"\n`);

    // ----------------------------------------------------
    // Scenario 6: Coupon Validation Math
    // ----------------------------------------------------
    console.log('🏷️ Scenario 6: Coupon Validation logic...');
    
    // Validate WELCOME75
    const couponValRes = await fetch(`${API_BASE}/checkout/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'WELCOME75',
        orderAmount: 600
      })
    });
    const couponValData = await couponValRes.json();
    if (!couponValData.success || couponValData.coupon.discountValue !== 75) {
      throw new Error(`Coupon WELCOME75 validation failed: ${JSON.stringify(couponValData)}`);
    }
    console.log('✅ Coupon WELCOME75 is valid (₹75 off detected).');

    // Validate coupon code with insufficient order total
    const couponLowRes = await fetch(`${API_BASE}/checkout/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'WELCOME75',
        orderAmount: 200 // Minimum amount is ₹599
      })
    });
    const couponLowData = await couponLowRes.json();
    if (couponLowData.success) {
      throw new Error('Coupon should have been rejected for insufficient order total.');
    }
    console.log('✅ Coupon correctly rejected for insufficient order total.\n');

    // ----------------------------------------------------
    // Scenario 7: Wishlist CRUD
    // ----------------------------------------------------
    console.log('❤️ Scenario 7: Testing Wishlist operations...');
    
    // Add to Wishlist
    const addWishRes = await fetch(`${API_BASE}/wishlist/${testProductId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const addWishData = await addWishRes.json();
    if (!addWishData.success) {
      throw new Error(`Failed to add to wishlist: ${JSON.stringify(addWishData)}`);
    }
    console.log('✅ Added product to wishlist.');

    // Fetch Wishlist
    const getWishRes = await fetch(`${API_BASE}/wishlist`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const getWishData = await getWishRes.json();
    if (!getWishData.success || !getWishData.wishlist.find(item => item.productId === testProductId)) {
      throw new Error(`Product not found in retrieved wishlist: ${JSON.stringify(getWishData)}`);
    }
    console.log('✅ Product confirmed in wishlist.');

    // Remove from Wishlist
    const delWishRes = await fetch(`${API_BASE}/wishlist/${testProductId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const delWishData = await delWishRes.json();
    if (!delWishData.success) {
      throw new Error('Failed to remove product from wishlist.');
    }
    console.log('✅ Removed product from wishlist.\n');

    // ----------------------------------------------------
    // Scenario 8: Checkout & PayU Sandbox Integration
    // ----------------------------------------------------
    console.log('💳 Scenario 8: Testing Checkout & Stock Reservation...');
    
    const checkoutRes = await fetch(`${API_BASE}/checkout/create-payment-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        items: [{ variantId: testVariantId, quantity: 6 }], // Changed to 6 to exceed minimum ₹599 order value
        shippingAddress: {
          name: 'Automated Tester',
          email: testEmail,
          phone: '9876543210',
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001'
        },
        couponCode: 'WELCOME75'
      })
    });

    const checkoutData = await checkoutRes.json();
    if ((checkoutRes.status !== 200 && checkoutRes.status !== 201) || !checkoutData.success || !checkoutData.payuConfig) {
      throw new Error(`Checkout payment order creation failed: ${JSON.stringify(checkoutData)}`);
    }
    testPayuTxnId = checkoutData.payuConfig.txnid;
    testOrderId = checkoutData.orderId;
    console.log('✅ Stock verified & reserved successfully!');
    console.log(`✅ PayU sandbox transaction created: ${testPayuTxnId}`);
    console.log(`✅ Mantraaq Order ID: ${testOrderId}\n`);

    // ----------------------------------------------------
    // Scenario 9: Admin login & Dashboard Metrics
    // ----------------------------------------------------
    console.log('👤 Scenario 9: Admin Dashboard & Settings...');
    
    // Login as Admin
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@mantraaq.com',
        password: process.env.ADMIN_PASSWORD || 'admin123456'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status !== 200 || !adminLoginData.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    }
    adminToken = adminLoginData.token;
    console.log('✅ Admin login successful!');

    // Fetch KPIs
    const metricsRes = await fetch(`${API_BASE}/admin/metrics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const metricsData = await metricsRes.json();
    if (!metricsData.success || metricsData.data.totalOrders === undefined) {
      throw new Error(`Failed to fetch admin metrics: ${JSON.stringify(metricsData)}`);
    }
    console.log('✅ Admin metrics retrieved successfully.');

    // Fetch Customers
    const adminCustomersRes = await fetch(`${API_BASE}/admin/customers`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminCustomersData = await adminCustomersRes.json();
    if (!adminCustomersData.success || !adminCustomersData.data.find(c => c.id === testUserId)) {
      throw new Error(`Our test customer not found in customer list: ${JSON.stringify(adminCustomersData)}`);
    }
    console.log('✅ Customer list returns correctly (Test customer included).');

    // ----------------------------------------------------
    // Scenario 10: Admin Coupon CRUD
    // ----------------------------------------------------
    console.log('\n🎟️ Scenario 10: Admin Coupon CRUD operations...');
    const newCouponCode = `TESTCRUD${Math.floor(Math.random() * 100)}`;
    
    // Create Coupon
    const createCouponRes = await fetch(`${API_BASE}/admin/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        code: newCouponCode,
        discountType: 'FIXED',
        discountValue: 50,
        minOrderAmount: 300,
        maxUses: 10
      })
    });
    const createCouponData = await createCouponRes.json();
    if (!createCouponRes.ok || !createCouponData.success) {
      throw new Error(`Admin Coupon creation failed: ${JSON.stringify(createCouponData)}`);
    }
    console.log(`✅ Coupon "${newCouponCode}" created successfully.`);

    // Delete Coupon
    const deleteCouponRes = await fetch(`${API_BASE}/admin/coupons/${createCouponData.data.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const deleteCouponData = await deleteCouponRes.json();
    if (!deleteCouponData.success) {
      throw new Error('Failed to delete coupon.');
    }
    console.log(`✅ Coupon "${newCouponCode}" deleted successfully.`);

    // Clean up database records (Tester user, passwordResetTokens, order items, order)
    console.log('\n🧹 Cleaning up test database records...');
    await prisma.orderLineItem.deleteMany({ where: { orderId: testOrderId } });
    await prisma.order.delete({ where: { id: testOrderId } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    console.log('✅ Cleaned up tester customer & orders records successfully.');

    console.log('\n🎉 ALL INTEGRATION TEST SCENARIOS PASSED SUCCESSFULLY! 100% SUCCESS ✅');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED!');
    console.error(error.message);
    process.exit(1);
  }
}

// Start
runTests();
