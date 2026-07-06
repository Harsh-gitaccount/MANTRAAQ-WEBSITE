/**
 * Mantraaq Centralized API Client
 * All backend API calls go through this module.
 * Loads toast.js dynamically for notifications.
 */

// ── Dynamically load toast.js (since it has no <script> tag in HTML) ──
(function loadToastScript() {
  if (!document.querySelector('script[src="js/toast.js"]')) {
    const script = document.createElement('script');
    script.src = 'js/toast.js';
    script.async = false; // Ensure it loads before other scripts use Toast
    document.head.appendChild(script);
  }
})();

// ── API Base URL ────────────────────────────────────────────────
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'))
  ? 'http://localhost:5000/api'
  : 'https://mantraaq-backend.onrender.com/api'; // Replace with your actual Render URL when deployed

// ── Core Fetch Wrapper ──────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  let url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('user_token');

  const headers = { ...(options.headers || {}) };

  // Prevent browser caching for GET requests
  const method = (options.method || 'GET').toUpperCase();
  if (method === 'GET') {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';
    
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}_t=${Date.now()}`;
  }

  // Auto-inject auth token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Auto-set Content-Type for JSON body methods
  if (['POST', 'PUT', 'PATCH'].includes((options.method || 'GET').toUpperCase()) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  const res = await fetch(url, fetchOptions);

  // Handle 401 Unauthorized — auto logout
  if (res.status === 401) {
    const isChangePassword = endpoint.includes('/auth/change-password');
    const isLogin = endpoint.includes('/auth/login');
    
    if (!isChangePassword && !isLogin) {
      localStorage.removeItem('user_token');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Session expired. Please log in again.');
  }

  const data = await res.json();

  if (!res.ok || data.success === false) {
    let errMsg = data.message;
    if (!errMsg && data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      errMsg = data.errors.map(err => err.msg).join(' ');
    }
    throw new Error(errMsg || `Request failed (${res.status})`);
  }

  return data;
}

// ── API Methods ─────────────────────────────────────────────────

// ─ Storefront / Products ─
async function fetchProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const endpoint = qs ? `/storefront/products?${qs}` : '/storefront/products';
  const data = await apiFetch(endpoint);
  return data.products;
}

async function searchProducts(query) {
  const data = await apiFetch(`/storefront/products/search?q=${encodeURIComponent(query)}`);
  return data.products;
}

async function getProductByHandle(handle) {
  const data = await apiFetch(`/storefront/products/${handle}`);
  return data.product;
}

async function getProductReviews(handle) {
  const data = await apiFetch(`/storefront/products/${handle}/reviews`);
  return data.reviews;
}

async function submitReview(handle, reviewData) {
  const data = await apiFetch(`/storefront/products/${handle}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
  return data.review;
}

// ─ Auth ─
async function register(formData) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
  return data;
}

async function login(formData) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
  return data;
}

async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (e) {
    // Logout can fail silently if token is already invalid
  }
}

async function getMe() {
  const data = await apiFetch('/auth/me');
  return data.user;
}

async function updateProfile(profileData) {
  const data = await apiFetch('/auth/update-profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
  return data;
}

async function changePassword(passwordData) {
  const data = await apiFetch('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  });
  return data;
}

async function forgotPassword(email) {
  const data = await apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return data;
}

async function resetPassword(resetData) {
  const data = await apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(resetData),
  });
  return data;
}

// ─ Orders ─
async function getMyOrders() {
  const data = await apiFetch('/orders/my-orders');
  return data.data;
}

async function getOrderById(id) {
  const data = await apiFetch(`/orders/my-orders/${id}`);
  return data.data;
}

async function cancelOrder(id) {
  const data = await apiFetch(`/orders/my-orders/${id}/cancel`, {
    method: 'POST',
  });
  return data;
}

// ─ Wishlist ─
async function getWishlist() {
  const data = await apiFetch('/wishlist');
  return data.wishlist;
}

async function addToWishlist(productId) {
  const data = await apiFetch(`/wishlist/${productId}`, {
    method: 'POST',
  });
  return data;
}

async function removeFromWishlist(productId) {
  const data = await apiFetch(`/wishlist/${productId}`, {
    method: 'DELETE',
  });
  return data;
}

async function checkWishlist(productId) {
  const data = await apiFetch(`/wishlist/check/${productId}`);
  return data.inWishlist;
}

// ─ Checkout / Payment ─
async function createPaymentOrder(orderData) {
  const data = await apiFetch('/checkout/create-payment-order', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
  return data;
}

async function verifyPayment(paymentData) {
  const data = await apiFetch('/checkout/verify-payment', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
  return data;
}

async function validateCoupon(code, amount) {
  const data = await apiFetch('/checkout/validate-coupon', {
    method: 'POST',
    body: JSON.stringify({ code, orderAmount: amount }),
  });
  return data;
}

async function fetchActiveCoupons() {
  const data = await apiFetch('/checkout/active-coupons');
  return data.coupons;
}

// ─ Newsletter ─
async function subscribeNewsletter(email) {
  const data = await apiFetch('/storefront/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return data;
}

// ─ Contact Form ─
async function submitContact(contactDetails) {
  const data = await apiFetch('/storefront/contact', {
    method: 'POST',
    body: JSON.stringify(contactDetails),
  });
  return data;
}

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('uploads/')) {
    const backendUrl = API_BASE.replace('/api', '');
    return `${backendUrl}/${url}`;
  }
  return url.startsWith('/') ? url : `/${url}`;
}

// ── Expose Global API ───────────────────────────────────────────
window.MantraaqAPI = {
  API_BASE,
  apiFetch,
  resolveImageUrl,
  fetchProducts,
  searchProducts,
  getProductByHandle,
  getProductReviews,
  submitReview,
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  createPaymentOrder,
  verifyPayment,
  validateCoupon,
  fetchActiveCoupons,
  subscribeNewsletter,
  submitContact,
};
