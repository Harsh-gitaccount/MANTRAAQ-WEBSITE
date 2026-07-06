const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';

async function runTest() {
  console.log('🧪 Starting Product Availability & Checkout Verification Test...\n');

  try {
    // 1. Admin Login
    console.log('🔑 Logging in as Admin...');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'mantraaqsuperfoods@gmail.com',
        password: process.env.ADMIN_PASSWORD || 'admin123456'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status !== 200 || !adminLoginData.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    }
    const adminToken = adminLoginData.token;
    console.log('✅ Admin login successful.\n');

    // 2. Fetch all products as Admin
    console.log('📦 Fetching products list as Admin...');
    const adminProductsRes = await fetch(`${API_BASE}/admin/products?limit=100`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminProductsData = await adminProductsRes.json();
    if (!adminProductsData.success || !adminProductsData.products.length) {
      throw new Error(`Failed to fetch admin products: ${JSON.stringify(adminProductsData)}`);
    }
    console.log(`✅ Admin products list loaded successfully. Found ${adminProductsData.products.length} products.`);
    
    // Select a product to toggle
    const targetProduct = adminProductsData.products[0];
    const targetProductId = targetProduct.id;
    const targetProductVariantId = targetProduct.variants[0].id;
    console.log(`👉 Selected product for test: "${targetProduct.name}" (ID: ${targetProductId}, Initial isActive: ${targetProduct.isActive})\n`);

    // Ensure it starts as active
    if (!targetProduct.isActive) {
      console.log('🔄 Product is currently inactive. Activating first...');
      const activateRes = await fetch(`${API_BASE}/admin/products/${targetProductId}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const activateData = await activateRes.json();
      if (!activateRes.ok || !activateData.success || !activateData.product.isActive) {
        throw new Error('Failed to activate product initially.');
      }
      console.log('✅ Activated product successfully.\n');
    }

    // 3. Deactivate the product
    console.log('🔒 Deactivating the product (Setting status to Hidden/Inactive)...');
    const deactivateRes = await fetch(`${API_BASE}/admin/products/${targetProductId}/toggle-status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const deactivateData = await deactivateRes.json();
    if (!deactivateRes.ok || !deactivateData.success || deactivateData.product.isActive) {
      throw new Error('Failed to deactivate product status.');
    }
    console.log('✅ Deactivation confirmed via API response.\n');

    // 4. Verify storefront does NOT return the deactivated product
    console.log('🥣 Checking storefront products list...');
    const storefrontRes = await fetch(`${API_BASE}/storefront/products?limit=100`);
    const storefrontData = await storefrontRes.json();
    if (!storefrontData.success) {
      throw new Error('Failed to fetch storefront products.');
    }
    
    const foundInStorefront = storefrontData.products.some(p => p.id === targetProductId);
    if (foundInStorefront) {
      throw new Error('❌ TEST FAILED: Deactivated product is still returned in storefront products list!');
    }
    console.log('✅ Success: Deactivated product is not present in the storefront products list.\n');

    // 5. Register and login a customer for checkout auth
    console.log('📝 Registering and logging in a test customer for checkout authentication...');
    const testCustomerEmail = `test_customer_${Math.floor(Math.random() * 100000)}@example.com`;
    const testCustomerPassword = 'Password123!';
    
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Availability Test Customer',
        email: testCustomerEmail,
        password: testCustomerPassword
      })
    });
    const registerData = await registerRes.json();
    if (registerRes.status !== 201 || !registerData.token) {
      throw new Error(`Customer registration failed: ${JSON.stringify(registerData)}`);
    }
    const customerToken = registerData.token;
    console.log('✅ Test customer registered and authenticated.\n');

    // Try to checkout/purchase a variant of the deactivated product
    console.log('💳 Attempting to check out variant of the deactivated product...');
    const checkoutRes = await fetch(`${API_BASE}/checkout/create-payment-order`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        items: [{ variantId: targetProductVariantId, quantity: 1 }],
        shippingAddress: {
          name: 'Automated Tester',
          email: testCustomerEmail,
          phone: '9876543210',
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001'
        },
        paymentMethod: 'COD'
      })
    });
    const checkoutData = await checkoutRes.json();
    
    console.log(`Checkout response status: ${checkoutRes.status}`);
    console.log(`Checkout response body: ${JSON.stringify(checkoutData)}`);

    if (checkoutRes.status === 200 || checkoutRes.status === 201 || checkoutData.success) {
      throw new Error('❌ TEST FAILED: Checkout of inactive product succeeded when it should have failed!');
    }
    
    if (!checkoutData.message || !checkoutData.message.includes('unavailable/hidden')) {
      throw new Error(`❌ TEST FAILED: Checkout failed, but the error message was unexpected: ${checkoutData.message}`);
    }
    console.log('✅ Success: Checkout was blocked with correct message indicating the product is unavailable/hidden.\n');

    // 6. Reactivate the product
    console.log('🔓 Reactivating the product...');
    const reactivateRes = await fetch(`${API_BASE}/admin/products/${targetProductId}/toggle-status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const reactivateData = await reactivateRes.json();
    if (!reactivateRes.ok || !reactivateData.success || !reactivateData.product.isActive) {
      throw new Error('Failed to reactivate product status.');
    }
    console.log('✅ Reactivation confirmed via API response.\n');

    // 7. Verify storefront returns the reactivated product again
    console.log('🥣 Re-checking storefront products list...');
    const storefrontRecheckRes = await fetch(`${API_BASE}/storefront/products?limit=100`);
    const storefrontRecheckData = await storefrontRecheckRes.json();
    const foundAgain = storefrontRecheckData.products.some(p => p.id === targetProductId);
    if (!foundAgain) {
      throw new Error('❌ TEST FAILED: Reactivated product is not showing in storefront list!');
    }
    console.log('✅ Success: Reactivated product is returned in storefront list again.\n');

    console.log('🎉 ALL AVAILABILITY AND CHECKOUT VERIFICATION TESTS PASSED SUCCESSFULLY! ✅');
    process.exit(0);

  } catch (error) {
    console.error('❌ AVAILABILITY TEST FAILED!');
    console.error(error.message);
    process.exit(1);
  }
}

runTest();
