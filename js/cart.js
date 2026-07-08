/**
 * Mantraaq Custom Cart & Checkout Engine
 */



// Inject Cart Drawer styles dynamically
(function injectCartStyles() {
  const styles = `
    /* Cart Drawer Overlay */
    .cart-overlay {
      position: fixed;
      inset: 0;
      background: rgba(8, 6, 13, 0.4);
      backdrop-filter: blur(8px);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .cart-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    /* Cart Drawer Sidebar */
    .cart-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: 440px;
      background: #ffffff;
      box-shadow: -10px 0 30px rgba(0,0,0,0.15);
      z-index: 1001;
      transform: translateX(100%);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .cart-overlay.active .cart-drawer {
      transform: translateX(0);
    }

    /* Header */
    .cart-hdr {
      padding: 24px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .cart-hdr h2 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .cart-close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #64748b;
      transition: color 0.2s;
    }
    .cart-close-btn:hover {
      color: #0f172a;
    }
    .checkout-back-btn {
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.6rem !important;
      color: #10b981 !important;
      background: rgba(16, 185, 129, 0.05) !important;
      border: 1px solid rgba(16, 185, 129, 0.18) !important;
      border-radius: 50px !important;
      font-size: 0.85rem !important;
      font-weight: 600 !important;
      padding: 0.45rem 1rem !important;
      cursor: pointer !important;
      line-height: 1 !important;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      outline: none !important;
      font-family: inherit !important;
      box-shadow: none !important;
    }
    .checkout-back-btn:hover {
      color: #059669 !important;
      background: rgba(16, 185, 129, 0.1) !important;
      border-color: rgba(16, 185, 129, 0.35) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08) !important;
    }
    .checkout-back-btn .back-icon {
      transition: transform 0.3s ease !important;
      display: inline-block !important;
    }
    .checkout-back-btn:hover .back-icon {
      transform: translateX(-3px) !important;
    }

    /* Scrollable body wrapper */
    .cart-body-scrollable {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      scrollbar-width: auto;
      scrollbar-color: #10b981 rgba(15, 23, 42, 0.05);
    }
    .cart-body-scrollable::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    .cart-body-scrollable::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.05);
      border-radius: 6px;
    }
    .cart-body-scrollable::-webkit-scrollbar-thumb {
      background: linear-gradient(to bottom, #4ade80, #10b981);
      border-radius: 6px;
      border: 2px solid #ffffff;
    }
    .cart-body-scrollable::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(to bottom, #22c55e, #10b981);
    }
    /* Inner items list */
    .cart-items-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .cart-item {
      display: flex;
      gap: 16px;
      border-bottom: 1px solid #f8fafc;
      padding-bottom: 16px;
    }
    .cart-item-img {
      width: 70px;
      height: 70px;
      border-radius: 8px;
      background: #f1f5f9;
      object-fit: cover;
      border: 1px solid #e2e8f0;
    }
    .cart-item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .cart-item-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    .cart-item-variant {
      font-size: 12px;
      color: #64748b;
      margin: 2px 0 0;
    }
    .cart-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;
    }
    .qty-selectors {
      display: flex;
      align-items: center;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    .qty-btn {
      background: #f8fafc;
      border: none;
      padding: 4px 10px;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .qty-btn:hover {
      background: #e2e8f0;
    }
    .qty-val {
      padding: 0 10px;
      font-size: 12px;
      font-weight: 600;
    }
    .cart-item-price {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .cart-item-remove {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 11px;
      cursor: pointer;
      padding: 0;
      margin-top: 4px;
      text-align: left;
      font-weight: 600;
    }

    /* Footer checkout panel */
    .cart-ftr {
      padding: 24px;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .cart-summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #475569;
      font-weight: 500;
    }
    .cart-summary-row.total {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      border-top: 1.5px dashed #cbd5e1;
      padding-top: 10px;
      margin-top: 6px;
    }
    .checkout-btn {
      width: 100%;
      background: linear-gradient(90deg, #10b981, #059669);
      border: none;
      color: #ffffff;
      padding: 14px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      transition: all 0.3s;
    }
    .checkout-btn:hover {
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
      transform: translateY(-1px);
    }
    .checkout-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* Address Form inside Drawer */
    .checkout-form-panel {
      display: none;
      flex-direction: column;
      gap: 12px;
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }
    .checkout-form-panel.active {
      display: flex;
    }
    .form-grp {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .form-grp label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .form-grp input {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 13px;
      color: #1e293b;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-grp input:focus {
      border-color: #10b981;
    }

    /* Cart Badge count */
    .cart-badge {
      background: #10b981;
      color: white;
      font-size: 10px;
      font-weight: 700;
      border-radius: 999px;
      padding: 2px 6px;
      margin-left: 4px;
      vertical-align: middle;
    }

    /* Premium Shipping Promotion Box */
    .shipping-promo-box {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.01);
      transition: all 0.3s ease;
    }
    .shipping-promo-box.free-unlocked {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .shipping-promo-msg {
      font-size: 12.5px;
      color: #92400e;
      font-weight: 600;
      text-align: center;
      margin: 0;
      line-height: 1.4;
    }
    .shipping-promo-box.free-unlocked .shipping-promo-msg {
      color: #166534;
    }
    .progress-bar-container {
      width: 100%;
      height: 6px;
      background: #f1f5f9;
      border-radius: 99px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #f59e0b, #eab308);
      border-radius: 99px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .shipping-promo-box.free-unlocked .progress-bar-fill {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    /* Premium PIN Code Validator Card */
    .pin-validator-card {
      margin-bottom: 12px;
      padding: 14px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
    .pin-input-label {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      display: block;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .pin-input-group {
      display: flex;
      gap: 8px;
    }
    .pin-input-field {
      flex: 1;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    .pin-input-field:focus {
      border-color: #2d7a4f;
    }
    .pin-check-btn {
      background: #2d7a4f;
      border: none;
      color: white;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .pin-check-btn:hover {
      background: #225c3c;
    }
    .pin-check-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .pin-feedback-msg {
      font-size: 11.5px;
      margin-top: 8px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Available Coupons Card Styles */
    .coupons-list-container {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 180px;
      overflow-y: auto;
      padding-right: 4px;
      border-top: 1px dashed #e2e8f0;
      padding-top: 8px;
    }
    .coupon-item-card {
      background: #ffffff;
      border: 1.5px dashed #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      cursor: pointer;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.25s ease;
    }
    .coupon-item-card:hover {
      border-color: #2d7a4f;
      background: #f4fbf7;
    }
    .coupon-item-card.applied {
      border-color: #10b981;
      background: #f0fdf4;
      cursor: default;
    }
    .coupon-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .coupon-code-badge {
      background: #e6f4ea;
      color: #137333;
      font-weight: 700;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      border: 1px solid #c2e7cc;
      text-transform: uppercase;
    }
    .coupon-item-card.applied .coupon-code-badge {
      background: #10b981;
      color: #ffffff;
      border-color: #10b981;
    }
    .coupon-apply-action {
      font-size: 11px;
      font-weight: 700;
      color: #2d7a4f;
    }
    .coupon-item-card.applied .coupon-apply-action {
      color: #10b981;
    }
    .coupon-card-desc {
      font-size: 11.5px;
      color: #334155;
      font-weight: 600;
      line-height: 1.3;
    }
    .coupon-card-min-order {
      font-size: 10px;
      color: #64748b;
    }

    /* Premium Payment Method Selection Cards */
    .payment-method-card {
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      text-align: center;
      background: #ffffff;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
    }
    .payment-method-card:hover {
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }
    .payment-method-card.active {
      border-color: #2d7a4f;
      background: #f0fdf4;
      box-shadow: 0 4px 10px rgba(45, 122, 79, 0.08);
    }
    .payment-method-card input[type="radio"] {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }
    .payment-method-card .method-title {
      font-weight: 700;
      font-size: 13px;
      color: #475569;
      transition: color 0.25s;
    }
    .payment-method-card.active .method-title {
      color: #166534;
    }
    .payment-method-card .method-subtitle {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
      transition: color 0.25s;
    }
    .payment-method-card.active .method-subtitle {
      color: #15803d;
    }
    .payment-method-card::after {
      content: "✓";
      position: absolute;
      top: 6px;
      right: 8px;
      font-size: 11px;
      color: #166534;
      font-weight: 700;
      opacity: 0;
      transform: scale(0.7);
      transition: all 0.2s ease;
    }
    .payment-method-card.active::after {
      opacity: 1;
      transform: scale(1.1);
    }

    /* Centered Modal on Desktop for both Cart and Checkout */
    @media (min-width: 768px) {
      .cart-drawer {
        right: 50%;
        top: 24px;
        bottom: 24px;
        height: calc(100vh - 48px);
        max-width: 550px;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        opacity: 0;
        transform: translate(50%, -30px);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .cart-overlay.active .cart-drawer {
        transform: translate(50%, 0);
        opacity: 1;
      }
      .cart-overlay.active .cart-drawer.checkout-active {
        max-width: 1000px;
        transform: translate(50%, 0);
      }
    }

    /* Checkout Grid Container */
    .checkout-grid-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .checkout-left-col {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }
    .checkout-right-col {
      padding: 24px;
      background: #f8fafc;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      border-top: 1px solid #e2e8f0;
    }
    
    @media (min-width: 768px) {
      .checkout-grid-container {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        height: 100%;
      }
      .checkout-left-col {
        height: 100%;
        border-right: 1px solid #e2e8f0;
      }
      .checkout-right-col {
        height: 100%;
        border-top: none;
      }
      .checkout-mobile-badges {
        display: none !important;
      }
    }
    @media (max-width: 767px) {
      .checkout-desktop-badges {
        display: none !important;
      }
    }
    .order-summary-card h3 {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1.5px dashed #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .checkout-items-summary-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 160px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .checkout-summary-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      color: #334155;
    }
    .checkout-summary-item-name {
      font-weight: 600;
      flex: 1;
      margin-right: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .checkout-summary-item-qty {
      color: #64748b;
      font-size: 12px;
      margin-right: 12px;
    }
    .checkout-summary-item-price {
      font-weight: 700;
      color: #0f172a;
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.innerHTML = styles;
  document.head.appendChild(styleEl);
})();

// Core LocalStorage Cart State
const Cart = {
  items: JSON.parse(localStorage.getItem('mantraaq_cart') || '[]'),
  appliedCoupon: JSON.parse(localStorage.getItem('mantraaq_coupon') || 'null'),
  isPinValidated: true,
  validatedPin: localStorage.getItem('mantraaq_pincode') || '',
  activeCouponsList: [],

  save() {
    localStorage.setItem('mantraaq_cart', JSON.stringify(this.items));
    localStorage.setItem('mantraaq_coupon', JSON.stringify(this.appliedCoupon));
    localStorage.setItem('mantraaq_pincode_val', 'true');
    localStorage.setItem('mantraaq_pincode', this.validatedPin);
    this.updateBadge();
  },

  getCart() {
    return this.items;
  },

  addItem(variant, product, quantity = 1) {
    const tags = (product.tags || []).map(t => t.toLowerCase().replace(/\s+/g, '-'));
    if (tags.includes('coming-soon')) {
      window.Toast.error(`Product Alert: ${product.name} is coming soon and cannot be added to the cart.`);
      return;
    }
    const existingIndex = this.items.findIndex(item => item.variantId === variant.id);
    const existingItem = existingIndex > -1 ? this.items[existingIndex] : null;
    const currentQty = existingItem ? existingItem.quantity : 0;
    const requestedQty = currentQty + quantity;

    if (variant.stockQuantity !== undefined && requestedQty > variant.stockQuantity) {
      window.Toast.error(`Inventory Limit: Only ${variant.stockQuantity} unit${variant.stockQuantity > 1 ? 's' : ''} of ${product.name} (${variant.title}) left.`);
      return;
    }

    const LOCAL_IMAGE_MAP = {
      'singhara-pasta-macaroni': 'assets/images/products/pasta-macaroni-1.png',
      'singhara-vermicell': 'assets/images/products/vermicelli-1.png',
      'singhara-atta': 'assets/images/products/atta-1.png',
      'fresh-singhara': 'assets/images/products/fresh-singhara-1.png',
      'dry-singhara': 'assets/images/products/dry-singhara-1.png',
      'singhara-snacks': 'assets/images/products/singhara-snacks-1.png'
    };
    const imgPath = product.images && product.images[0]
      ? product.images[0]
      : (LOCAL_IMAGE_MAP[product.handle] || '');

    if (existingIndex > -1) {
      this.items[existingIndex].stockQuantity = variant.stockQuantity;
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        variantId: variant.id,
        productId: product.id,
        name: product.name,
        handle: product.handle,
        title: variant.title,
        price: variant.price,
        image: imgPath,
        quantity: quantity,
        stockQuantity: variant.stockQuantity,
      });
    }
    this.save();
    this.render();
    window.Toast.success(`Added to Cart: ${product.name} (${variant.title}).`);
    
    // Recalculate active coupon validity based on new total
    if (this.appliedCoupon) {
      this.revalidateAppliedCoupon();
    }
  },

  removeItem(variantId) {
    this.items = this.items.filter(item => item.variantId !== variantId);
    this.save();
    this.render();

    // Recalculate coupon or remove it if cart is empty/invalidated
    if (this.appliedCoupon) {
      this.revalidateAppliedCoupon();
    }
  },

  updateQuantity(variantId, newQty) {
    const item = this.items.find(item => item.variantId === variantId);
    if (item) {
      if (newQty > item.quantity) {
        if (item.stockQuantity !== undefined && newQty > item.stockQuantity) {
          window.Toast.error(`Inventory Limit: Only ${item.stockQuantity} unit${item.stockQuantity > 1 ? 's' : ''} of ${item.name} (${item.title}) left.`);
          return;
        }
      }
      item.quantity = Math.max(1, newQty);
      this.save();
      this.render();

      if (this.appliedCoupon) {
        this.revalidateAppliedCoupon();
      }
    }
  },

  syncStock(products) {
    let changed = false;
    this.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const variant = product.variants.find(v => v.id === item.variantId);
        if (variant) {
          item.stockQuantity = variant.stockQuantity;
          if (item.quantity > variant.stockQuantity) {
            item.quantity = variant.stockQuantity;
            changed = true;
          }
        }
      }
    });

    const originalCount = this.items.length;
    this.items = this.items.filter(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product || !product.isActive) return false;
      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant || variant.stockQuantity <= 0) return false;
      return true;
    });

    if (this.items.length !== originalCount) {
      changed = true;
    }

    if (changed) {
      this.save();
      this.render();
      if (this.appliedCoupon) {
        this.revalidateAppliedCoupon();
      }
    }
  },

  clear() {
    this.items = [];
    this.appliedCoupon = null;
    this.save();
    this.render();
  },

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getDiscountAmount() {
    if (!this.appliedCoupon) return 0;
    const total = this.getTotal();
    if (this.appliedCoupon.discountType === 'PERCENTAGE') {
      return (total * this.appliedCoupon.discountValue) / 100;
    } else {
      return Math.min(total, this.appliedCoupon.discountValue);
    }
  },

  getShippingCharge() {
    const subtotal = this.getTotal();
    if (subtotal < 499) {
      return 49;
    }
    return 0;
  },

  getCodFee() {
    const subtotal = this.getTotal();
    const paymentMethod = this.getSelectedPaymentMethod();
    if (paymentMethod === 'COD' && subtotal < 299) {
      return 40;
    }
    return 0;
  },

  getFinalTotal() {
    const subtotal = this.getTotal();
    const discount = this.getDiscountAmount();
    const shipping = this.getShippingCharge();
    const cod = this.getCodFee();
    return Math.max(0, subtotal - discount + shipping + cod);
  },

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  // Setup DOM overlay
  init() {
    const savedPin = this.validatedPin || '';
    const pinSuccessDisplay = this.isPinValidated ? 'block' : 'none';
    const pinSuccessMsg = this.isPinValidated ? `✓ Standard Delivery (3–8 Business Days) available for ${this.validatedPin} across India!` : '';

    const overlayHTML = `
      <div id="cartOverlay" class="cart-overlay" onclick="Cart.handleOverlayClick(event)">
        <div class="cart-drawer">
          <!-- PANEL 1: CART ITEMS VIEW -->
          <div id="cartItemsPanel" style="display:flex; flex-direction:column; height:100%;">
            <div class="cart-hdr">
              <h2>Your Cart</h2>
              <button class="cart-close-btn" onclick="Cart.close()">&times;</button>
            </div>
            
            <div class="cart-body-scrollable">
              <div id="cartItemsList" class="cart-items-list">
                <!-- Rendered dynamically -->
              </div>
              
              <!-- Shipping promotion message -->
              <div id="shippingPromoWrapper" class="shipping-promo-box">
                <div id="shippingPromoMsg" class="shipping-promo-msg"></div>
                <div class="progress-bar-container">
                  <div id="shippingProgressBarFill" class="progress-bar-fill"></div>
                </div>
              </div>

              <!-- Coupon Area -->
              <div class="coupon-section" style="border-top:1px solid #e2e8f0; padding-top:12px; margin-top:4px;">
                <div style="display:flex; gap:8px;" id="couponInputWrapper">
                  <input type="text" id="cartCouponInput" placeholder="COUPON CODE" style="flex:1; border:1px solid #cbd5e1; border-radius:6px; padding:6px 12px; font-size:12px; text-transform:uppercase; font-weight:700; outline:none;" />
                  <button id="applyCouponBtn" onclick="Cart.applyCoupon()" style="background:#10b981; border:none; color:white; border-radius:6px; padding:6px 12px; font-size:12px; font-weight:600; cursor:pointer;">Apply</button>
                </div>
                <div id="appliedCouponWrapper" style="display:none; align-items:center; justify-content:space-between; background:#d1fae5; border:1px solid #a7f3d0; border-radius:6px; padding:6px 12px; font-size:12.5px; color:#065f46; font-weight:600; margin-top:4px;">
                  <span id="appliedCouponText">WELCOME10 applied</span>
                  <button onclick="Cart.removeCoupon()" style="background:none; border:none; color:#ef4444; font-size:16px; font-weight:700; cursor:pointer; padding:0; line-height:1;">&times;</button>
                </div>
                
                <div id="availableCouponsWrapper" style="margin-top: 8px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; overflow: hidden;">
                  <button type="button" onclick="Cart.toggleCouponsAccordion()" style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #f8fafc; border: none; font-size: 12px; font-weight: 700; color: #475569; cursor: pointer; text-align: left; outline: none; transition: background 0.2s;">
                    <span style="display: flex; align-items: center; gap: 6px;">
                      🏷️ <span id="couponsAccordionTitle">Available Coupons (0)</span>
                      <span id="couponsLoadingIndicator" style="font-weight: normal; font-size: 10px; text-transform: none; display: none; color: #64748b; margin-left: 4px;">(loading...)</span>
                    </span>
                    <span id="couponsAccordionArrow" style="transition: transform 0.2s; font-size: 10px;">▼</span>
                  </button>
                  <div id="availableCouponsList" class="coupons-list-container" style="display: none; padding: 10px; max-height: 180px; overflow-y: auto; gap: 8px; flex-direction: column;">
                    <!-- Populated dynamically from API -->
                  </div>
                </div>
              </div>
            </div>
            
            <div class="cart-ftr">
              <div class="cart-summary-row">
                <span>Subtotal:</span>
                <span id="cartSubtotal">₹0</span>
              </div>
              
              <div class="cart-summary-row" id="shippingSummaryRow">
                <span>Shipping Charge:</span>
                <span id="cartShipping">₹39</span>
              </div>

              <div class="cart-summary-row" id="discountSummaryRow" style="display:none; color:#10b981;">
                <span>Discount:</span>
                <span id="cartDiscount">-₹0</span>
              </div>
              
              <div class="cart-summary-row total">
                <span>Total Amount:</span>
                <span id="cartTotal">₹0</span>
              </div>
              <div style="text-align: right; font-size: 11px; color: #64748b; margin-top: -6px; margin-bottom: 12px;">Inclusive of all taxes</div>
              
              <button class="checkout-btn" onclick="Cart.showCheckoutForm()">Proceed to Checkout</button>
            </div>
          </div>

          <!-- PANEL 2: SHIPPING DETAILS & PAYMENT FORM -->
          <div id="checkoutFormPanel" class="checkout-form-panel">
            <div class="checkout-grid-container">
              <!-- Left Column: Shipping details and Payment Method Selection -->
              <div class="checkout-left-col">
                <div class="cart-hdr" style="padding: 0 0 16px 0; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
                  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0;">Shipping Details</h2>
                  <button type="button" class="checkout-back-btn" onclick="Cart.showCartItemsPanel()">
                    <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    <span>Back to Cart</span>
                  </button>
                </div>
                
                <form id="shippingForm" onsubmit="Cart.handleCheckoutSubmit(event)" style="display:flex; flex-direction:column; gap:12px; padding-bottom: 24px;">
                  <div class="form-grp">
                    <label>Recipient Name</label>
                    <input type="text" id="shipName" placeholder="Full Name" required />
                  </div>
                  <div class="form-grp">
                    <label>Email Address</label>
                    <input type="email" id="shipEmail" placeholder="name@email.com" required />
                  </div>
                  <div class="form-grp">
                    <label>Phone Number</label>
                    <input type="tel" id="shipPhone" placeholder="10-digit Mobile Number" pattern="[0-9]{10}" required />
                  </div>
                  <div class="form-grp">
                    <label>Street Address</label>
                    <input type="text" id="shipStreet" placeholder="House/Flat No, Apartment, Area" required />
                  </div>
                  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                    <div class="form-grp">
                      <label>City</label>
                      <input type="text" id="shipCity" placeholder="City" required />
                    </div>
                    <div class="form-grp">
                      <label>State</label>
                      <input type="text" id="shipState" placeholder="State" required />
                    </div>
                  </div>
                  <div class="form-grp" style="position: relative;">
                    <label>Postal PIN Code (India)</label>
                    <div style="position: relative; display: flex; align-items: center;">
                      <input type="text" id="shipPostal" placeholder="6-digit PIN" pattern="[0-9]{6}" maxlength="6" required style="width: 100%; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; transition: border-color 0.2s;" />
                      <span id="checkoutPinStatus" style="position: absolute; right: 12px; font-size: 12px; display: none;"></span>
                    </div>
                    <span id="checkoutPinMsg" style="font-size: 11px; margin-top: 4px; display: none; font-weight: 600;"></span>
                  </div>
                  
                  <!-- Payment Method Selection -->
                  <div class="form-grp" style="margin-top:8px;">
                    <label style="font-weight: 700; font-size: 13px; color: #334155; margin-bottom: 6px; display:block;">Select Payment Method</label>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                      <label class="payment-method-card active" id="payMethodOnlineLabel">
                        <input type="radio" name="paymentMethod" value="ONLINE" checked onchange="Cart.handlePaymentMethodChange()" />
                        <span class="method-title">Pay Online</span>
                        <span class="method-subtitle">UPI, Cards, NetBanking</span>
                      </label>
                      <label class="payment-method-card" id="payMethodCodLabel">
                        <input type="radio" name="paymentMethod" value="COD" onchange="Cart.handlePaymentMethodChange()" />
                        <span class="method-title">Cash on Delivery</span>
                        <span class="method-subtitle">Convenience Fee applies</span>
                      </label>
                    </div>
                    <div id="codWarningMsg" style="background:#fffbeb; border:1px solid #fef3c7; border-radius:6px; padding:8px 12px; font-size:11.5px; color:#92400e; font-weight:600; display:none; margin-top:8px; text-align:center;">
                      💡 Save ₹39 by paying online!
                    </div>
                  </div>

                  <!-- Trust Badges on Mobile -->
                  <div class="checkout-mobile-badges" style="margin-top:8px; padding:12px; background:#f0fdf4; border:1px solid #d1fae5; border-radius:8px; display:grid; grid-template-columns:1fr 1fr; gap:8px 12px; font-size:11px; color:#065f46; font-weight:600;">
                    <div style="display:flex; align-items:center; gap:6px;">🔒 Secure Payments</div>
                    <div style="display:flex; align-items:center; gap:6px;">📄 GST Invoice Available</div>
                    <div style="display:flex; align-items:center; gap:6px;">🚚 Pan-India Delivery</div>
                    <div style="display:flex; align-items:center; gap:6px;">🧪 Quality Tested</div>
                  </div>
                </form>
              </div>

              <!-- Right Column: Order Summary & Pricing Summary -->
              <div class="checkout-right-col">
                <div class="order-summary-card">
                  <h3>Order Summary</h3>
                  <div id="checkoutItemsList" class="checkout-items-summary-list">
                    <!-- Rendered dynamically -->
                  </div>
                </div>

                <!-- Price Breakdown Box -->
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:8px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                  <div style="display:flex; justify-content:space-between; color:#475569; font-size:13px;">
                    <span>Subtotal:</span>
                    <span id="checkoutSubtotal" style="font-weight: 600; color: #0f172a;">₹0</span>
                  </div>
                  <div style="display:none; justify-content:space-between; color:#10b981; font-size:13px;" id="checkoutDiscountRow">
                    <span>Discount:</span>
                    <span id="checkoutDiscount" style="font-weight: 600;">-₹0</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; color:#475569; font-size:13px;">
                    <span>Shipping Charge:</span>
                    <span id="checkoutShipping" style="font-weight: 600; color: #0f172a;">₹0</span>
                  </div>
                  <div style="display:none; justify-content:space-between; color:#475569; font-size:13px;" id="checkoutCodRow">
                    <span>COD Convenience Fee:</span>
                    <span id="checkoutCod" style="font-weight: 600; color: #0f172a;">₹0</span>
                  </div>
                  <div style="height:1px; background:#e2e8f0; margin:4px 0;"></div>
                  <div style="display:flex; justify-content:space-between; font-weight:700; font-size:15px; color:#1e293b;">
                    <span>Total Amount:</span>
                    <span id="checkoutTotal" style="color: #0f172a;">₹0</span>
                  </div>
                  <div style="text-align:right; font-size:10px; color:#64748b; margin-top:-2px;">Inclusive of all taxes</div>
                </div>

                <!-- Trust Badges (Desktop) -->
                <div class="checkout-desktop-badges" style="padding:12px; background:#f0fdf4; border:1px solid #d1fae5; border-radius:8px; display:grid; grid-template-columns:1fr 1fr; gap:8px 12px; font-size:11px; color:#065f46; font-weight:600; margin-top: auto;">
                  <div style="display:flex; align-items:center; gap:6px;">🔒 Secure Payments</div>
                  <div style="display:flex; align-items:center; gap:6px;">📄 GST Invoice Available</div>
                  <div style="display:flex; align-items:center; gap:6px;">🚚 Pan-India Delivery</div>
                  <div style="display:flex; align-items:center; gap:6px;">🧪 Quality Tested</div>
                  <div style="display:flex; align-items:center; gap:6px; grid-column: span 2; justify-content: center;">🌾 Direct from MantraAQ</div>
                </div>

                <p style="font-size: 10.5px; color: #94a3b8; line-height: 1.5; text-align: center; margin-top: 10px; padding: 0 4px;">
                  By placing this order, you agree to our
                  <a href="terms-and-conditions.html" target="_blank" style="color: #10b981; text-decoration: underline;">Terms &amp; Conditions</a>,
                  <a href="privacy-policy.html" target="_blank" style="color: #10b981; text-decoration: underline;">Privacy Policy</a>,
                  <a href="shipping-policy.html" target="_blank" style="color: #10b981; text-decoration: underline;">Shipping Policy</a> and
                  <a href="refund-policy.html" target="_blank" style="color: #10b981; text-decoration: underline;">Refund &amp; Replacement Policy</a>.
                </p>

                <button type="submit" form="shippingForm" class="checkout-btn" id="paySubmitBtn" style="margin-top: 12px;">
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', overlayHTML);

    // Bind click events to all cart buttons on the website
    document.querySelectorAll('[data-action="cart"]').forEach(el => {
      el.removeAttribute('href');
      el.style.cursor = 'pointer';
      
      el.addEventListener('click', (e) => {
        e.preventDefault();
        Cart.open();
      });
    });

    // Bind change/input event listener to shipping pincode input in checkout
    const shipPostal = document.getElementById('shipPostal');
    if (shipPostal) {
      shipPostal.addEventListener('input', async (e) => {
        const pin = e.target.value.trim();
        if (pin.length === 6) {
          await Cart.validateAndProcessCheckoutPin(pin);
        } else {
          const statusEl = document.getElementById('checkoutPinStatus');
          const msgEl = document.getElementById('checkoutPinMsg');
          if (statusEl) statusEl.style.display = 'none';
          if (msgEl) msgEl.style.display = 'none';
          Cart.isPinValidated = false;
          Cart.save();
        }
      });
    }

    // Listen to authentication login event to re-validate coupon and prefill shipping details
    window.addEventListener('auth:login', () => {
      this.prefillForm(true);
      if (this.appliedCoupon) {
        this.revalidateAppliedCoupon();
      }
      
      // Auto-transition to checkout if the cart drawer is open
      const overlay = document.getElementById('cartOverlay');
      if (overlay && overlay.classList.contains('active')) {
        this.showCheckoutForm();
      }
    });

    window.addEventListener('auth:logout', () => {
      this.appliedCoupon = null;
      this.save();
      this.renderCouponUI(false);
      this.showCartItemsPanel();
    });

    this.updateBadge();
    this.render();
  },

  open() {
    const overlay = document.getElementById('cartOverlay');
    if (overlay) overlay.classList.add('active');
    this.showCartItemsPanel();
    this.prefillForm();
    this.fetchAndRenderCoupons();
  },

  close() {
    const overlay = document.getElementById('cartOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  handleOverlayClick(e) {
    if (e.target.id === 'cartOverlay') {
      this.close();
    }
  },

  async validatePinCode(pin) {
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(pin)) {
      return { valid: false, message: 'Invalid 6-digit PIN Code.' };
    }
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const po = data[0].PostOffice[0];
        return {
          valid: true,
          city: po.District || po.Name,
          state: po.State,
          country: po.Country
        };
      } else {
        return { valid: false, message: 'Invalid Indian PIN Code or Serviceable Area.' };
      }
    } catch (err) {
      console.error('PIN Validation Error:', err);
      // Fallback: accept 6-digit pincode if government API is temporarily offline
      return { valid: true, isFallback: true, city: '', state: '' };
    }
  },

  async checkPinCode() {
    const pinInput = document.getElementById('cartPinInput');
    const msgEl = document.getElementById('pinCheckMsg');
    const checkBtn = document.querySelector('.pin-check-btn') || document.querySelector('[onclick="Cart.checkPinCode()"]');
    if (!pinInput || !msgEl) return;

    const pin = pinInput.value.trim();
    
    if (checkBtn) {
      checkBtn.disabled = true;
      checkBtn.textContent = 'Checking...';
    }

    const result = await this.validatePinCode(pin);

    if (checkBtn) {
      checkBtn.disabled = false;
      checkBtn.textContent = 'Check';
    }

    if (!result.valid) {
      this.isPinValidated = false;
      this.validatedPin = '';
      this.save();
      msgEl.style.display = 'block';
      msgEl.style.color = '#ef4444';
      msgEl.textContent = `✕ ${result.message || 'Please enter a valid 6-digit Indian PIN Code'}`;
      window.Toast.error(result.message || 'Verification Failed: Invalid PIN Code.');
      
      const shipPostal = document.getElementById('shipPostal');
      if (shipPostal) shipPostal.value = '';
      const checkoutPinStatus = document.getElementById('checkoutPinStatus');
      if (checkoutPinStatus) checkoutPinStatus.style.display = 'none';
      const checkoutPinMsg = document.getElementById('checkoutPinMsg');
      if (checkoutPinMsg) checkoutPinMsg.style.display = 'none';
      
      return;
    }

    this.isPinValidated = true;
    this.validatedPin = pin;
    this.save();
    msgEl.style.display = 'block';
    msgEl.style.color = '#15803d';
    msgEl.textContent = `✓ Standard Delivery (3–8 Business Days) available for ${pin} across India!`;
    window.Toast.success('PIN Verified: Standard delivery is available.');

    // Prefill in form if available
    const shipPostal = document.getElementById('shipPostal');
    if (shipPostal) {
      shipPostal.value = pin;
    }
    const cityInput = document.getElementById('shipCity');
    const stateInput = document.getElementById('shipState');
    if (result.city && cityInput) cityInput.value = result.city;
    if (result.state && stateInput) stateInput.value = result.state;

    const checkoutPinStatus = document.getElementById('checkoutPinStatus');
    if (checkoutPinStatus) {
      checkoutPinStatus.style.display = 'inline';
      checkoutPinStatus.innerHTML = '<span style="color:#10b981;">✓</span>';
    }
    const checkoutPinMsg = document.getElementById('checkoutPinMsg');
    if (checkoutPinMsg) {
      checkoutPinMsg.style.display = 'block';
      checkoutPinMsg.style.color = '#15803d';
      checkoutPinMsg.textContent = '✓ Serviceable Pincode';
    }
  },

  async validateAndProcessCheckoutPin(pin) {
    const statusEl = document.getElementById('checkoutPinStatus');
    const msgEl = document.getElementById('checkoutPinMsg');
    const cityInput = document.getElementById('shipCity');
    const stateInput = document.getElementById('shipState');

    if (statusEl) {
      statusEl.style.display = 'inline';
      statusEl.innerHTML = '<span style="color:#64748b;">⏳</span>';
    }

    const result = await this.validatePinCode(pin);

    if (result.valid) {
      this.isPinValidated = true;
      this.validatedPin = pin;
      this.save();

      if (statusEl) {
        statusEl.style.display = 'inline';
        statusEl.innerHTML = '<span style="color:#10b981;">✓</span>';
      }
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = '#15803d';
        msgEl.textContent = '✓ Serviceable Pincode';
      }

      if (result.city && cityInput) cityInput.value = result.city;
      if (result.state && stateInput) stateInput.value = result.state;

      // Sync back to cart drawer pincode input (if it exists)
      const cartPinInput = document.getElementById('cartPinInput');
      if (cartPinInput) cartPinInput.value = pin;
      
      this.updateCheckoutTotals();
      window.Toast.success('PIN Verified: Location details auto-populated.');
    } else {
      this.isPinValidated = true; // Always true to not block the checkout flow
      this.validatedPin = pin;
      this.save();

      if (statusEl) {
        statusEl.style.display = 'inline';
        statusEl.innerHTML = '<span style="color:#eab308;">⚠️</span>';
      }
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = '#ca8a04';
        msgEl.textContent = '⚠️ Auto-population failed (enter City & State manually)';
      }
      window.Toast.warning('Auto-population failed: Please enter City & State manually.');
    }
  },

  handlePaymentMethodChange() {
    const onlineRadio = document.querySelector('input[name="paymentMethod"][value="ONLINE"]');
    const codRadio = document.querySelector('input[name="paymentMethod"][value="COD"]');
    
    const onlineLabel = document.getElementById('payMethodOnlineLabel');
    const codLabel = document.getElementById('payMethodCodLabel');
    
    if (onlineRadio && onlineRadio.checked) {
      onlineLabel.classList.add('active');
      codLabel.classList.remove('active');
    } else if (codRadio && codRadio.checked) {
      codLabel.classList.add('active');
      onlineLabel.classList.remove('active');
    }

    this.updateCheckoutTotals();
  },

  getSelectedPaymentMethod() {
    const codRadio = document.querySelector('input[name="paymentMethod"][value="COD"]');
    return (codRadio && codRadio.checked) ? 'COD' : 'ONLINE';
  },

  updateCheckoutTotals() {
    const subtotal = this.getTotal();
    const discount = this.getDiscountAmount();
    const shipping = this.getShippingCharge();
    const cod = this.getCodFee();
    const finalTotal = Math.max(0, subtotal - discount + shipping + cod);

    const subtotalEl = document.getElementById('checkoutSubtotal');
    const discountRow = document.getElementById('checkoutDiscountRow');
    const discountEl = document.getElementById('checkoutDiscount');
    const shippingEl = document.getElementById('checkoutShipping');
    const codRow = document.getElementById('checkoutCodRow');
    const codEl = document.getElementById('checkoutCod');
    const totalEl = document.getElementById('checkoutTotal');
    const codWarning = document.getElementById('codWarningMsg');
    const paySubmitBtn = document.getElementById('paySubmitBtn');

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(0)}`;
    
    if (discountRow && discountEl) {
      if (discount > 0) {
        discountRow.style.display = 'flex';
        discountEl.textContent = `-₹${discount.toFixed(0)}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (shippingEl) {
      shippingEl.textContent = shipping > 0 ? `₹${shipping.toFixed(0)}` : 'FREE';
    }

    if (codRow && codEl) {
      const isCod = this.getSelectedPaymentMethod() === 'COD';
      if (isCod) {
        codRow.style.display = 'flex';
        codEl.textContent = cod > 0 ? `₹${cod.toFixed(0)}` : 'FREE';
      } else {
        codRow.style.display = 'none';
      }
    }

    if (totalEl) totalEl.textContent = `₹${finalTotal.toFixed(0)}`;

    // Online Savings Callout
    if (codWarning) {
      const isCod = this.getSelectedPaymentMethod() === 'COD';
      if (isCod && subtotal < 299) {
        codWarning.style.display = 'block';
      } else {
        codWarning.style.display = 'none';
      }
    }

    // Update submit button text
    if (paySubmitBtn) {
      const isCod = this.getSelectedPaymentMethod() === 'COD';
      if (isCod) {
        paySubmitBtn.textContent = `Place COD Order (₹${finalTotal.toFixed(0)})`;
      } else {
        paySubmitBtn.textContent = `Proceed to Pay ₹${finalTotal.toFixed(0)}`;
      }
    }
  },

  showCheckoutForm() {
    if (this.items.length === 0) {
      window.Toast.warning('Cart Empty: Add items before proceeding to checkout.');
      return;
    }

    // ── LOGIN GATE: Checkout requires authentication ──────────
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
      window.Toast.warning('Login Required: Please sign in before proceeding to checkout.');
      if (window.CustomerAuth) {
        window.CustomerAuth.open();
      }
      return;
    }

    document.getElementById('cartItemsPanel').style.display = 'none';
    document.getElementById('checkoutFormPanel').classList.add('active');
    
    const drawer = document.querySelector('.cart-drawer');
    if (drawer) {
      drawer.classList.add('checkout-active');
    }
    this.renderCheckoutSummary();

    // Set PIN code
    const shipPostal = document.getElementById('shipPostal');
    if (shipPostal) {
      shipPostal.value = this.validatedPin;
    }

    if (this.validatedPin) {
      this.validateAndProcessCheckoutPin(this.validatedPin);
    }

    this.updateCheckoutTotals();
  },

  showCartItemsPanel() {
    document.getElementById('cartItemsPanel').style.display = 'flex';
    document.getElementById('checkoutFormPanel').classList.remove('active');
    
    const drawer = document.querySelector('.cart-drawer');
    if (drawer) {
      drawer.classList.remove('checkout-active');
    }
  },

  prefillForm(force = false) {
    // Prefill form from CustomerAuth if logged in
    if (window.CustomerAuth && window.CustomerAuth.user) {
      const u = window.CustomerAuth.user;
      const shipName = document.getElementById('shipName');
      const shipEmail = document.getElementById('shipEmail');
      const shipPhone = document.getElementById('shipPhone');

      if (shipName && (force || !shipName.value)) shipName.value = u.name || '';
      if (shipEmail && (force || !shipEmail.value)) shipEmail.value = u.email || '';
      if (shipPhone && (force || !shipPhone.value)) shipPhone.value = u.phone || '';
    }
  },

  async applyCoupon() {
    const input = document.getElementById('cartCouponInput');
    const code = input.value.trim().toUpperCase();
    if (!code) {
      window.Toast.warning('Coupon Empty: Enter a code to apply.');
      return;
    }

    const applyBtn = document.getElementById('applyCouponBtn');
    applyBtn.disabled = true;
    applyBtn.textContent = 'Applying...';

    try {
      const data = await window.MantraaqAPI.validateCoupon(code, this.getTotal());
      if (data && data.success) {
        this.appliedCoupon = data.coupon;
        this.save();
        window.Toast.success(`Coupon Applied: "${code}" discount is active.`);
        this.renderCouponUI(true);
      } else {
        window.Toast.error(data.message || 'Verification Failed: Invalid coupon.');
        this.renderCouponUI(false);
      }
    } catch (err) {
      console.error('Coupon validation error:', err);
      window.Toast.error(err.message || 'Verification Failed: Failed to apply coupon.');
      this.renderCouponUI(false);
    } finally {
      applyBtn.disabled = false;
      applyBtn.textContent = 'Apply';
    }
  },

  removeCoupon() {
    this.appliedCoupon = null;
    this.save();
    const input = document.getElementById('cartCouponInput');
    if (input) input.value = '';
    
    this.renderCouponUI(false);
    window.Toast.success('Coupon Removed: Cart total updated.');
  },

  async revalidateAppliedCoupon() {
    if (!this.appliedCoupon) return;
    try {
      const data = await window.MantraaqAPI.validateCoupon(this.appliedCoupon.code, this.getTotal());
      if (data && data.success) {
        this.appliedCoupon = data.coupon;
        this.save();
        this.renderCouponUI(true);
      } else {
        const removedCode = this.appliedCoupon.code;
        this.appliedCoupon = null;
        this.save();
        this.renderCouponUI(false);
        window.Toast.warning(data?.message || `Coupon Removed: "${removedCode}" is no longer valid.`);
      }
    } catch (err) {
      this.appliedCoupon = null;
      this.save();
      this.renderCouponUI(false);
    }
  },

  renderCouponUI(isApplied) {
    const inputWrapper = document.getElementById('couponInputWrapper');
    const appliedWrapper = document.getElementById('appliedCouponWrapper');
    const discountRow = document.getElementById('discountSummaryRow');
    const textEl = document.getElementById('appliedCouponText');

    if (isApplied && this.appliedCoupon) {
      inputWrapper.style.display = 'none';
      appliedWrapper.style.display = 'flex';
      discountRow.style.display = 'flex';

      const symbol = this.appliedCoupon.discountType === 'PERCENTAGE' ? '%' : ' OFF';
      textEl.textContent = `${this.appliedCoupon.code} (${this.appliedCoupon.discountValue}${symbol})`;
    } else {
      inputWrapper.style.display = 'flex';
      appliedWrapper.style.display = 'none';
      discountRow.style.display = 'none';
    }

    this.renderCouponsList();
    this.renderTotals();
  },

  updateBadge() {
    const count = this.getCount();
    document.querySelectorAll('.nav-cart, .nav-drawer-cart').forEach(el => {
      let badge = el.querySelector('.cart-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        el.appendChild(badge);
      }
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    });
  },

  renderTotals() {
    const subtotalEl = document.getElementById('cartSubtotal');
    const discountEl = document.getElementById('cartDiscount');
    const shippingEl = document.getElementById('cartShipping');
    const totalEl = document.getElementById('cartTotal');
    const promoEl = document.getElementById('shippingPromoMsg');
    const fillEl = document.getElementById('shippingProgressBarFill');
    const promoWrapper = document.getElementById('shippingPromoWrapper');

    const subtotal = this.getTotal();
    const discount = this.getDiscountAmount();
    const shipping = this.getShippingCharge();
    const finalTotal = this.getFinalTotal();

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(0)}`;
    if (discountEl) discountEl.textContent = `-₹${discount.toFixed(0)}`;
    if (shippingEl) {
      shippingEl.textContent = shipping > 0 ? `₹${shipping.toFixed(0)}` : 'FREE';
    }
    if (totalEl) totalEl.textContent = `₹${finalTotal.toFixed(0)}`;

    if (promoEl) {
      const threshold = 499;
      if (subtotal < threshold) {
        const remaining = threshold - subtotal;
        promoEl.textContent = `Add ₹${remaining.toFixed(0)} more to get FREE Shipping!`;
      } else {
        promoEl.textContent = `🎉 You have unlocked FREE Shipping!`;
      }
    }

    const pct = Math.min(100, (subtotal / 499) * 100);
    if (fillEl) {
      fillEl.style.width = `${pct}%`;
    }
    if (promoWrapper) {
      if (subtotal >= 499) {
        promoWrapper.classList.add('free-unlocked');
      } else {
        promoWrapper.classList.remove('free-unlocked');
      }
    }
  },

  render() {
    const listEl = document.getElementById('cartItemsList');
    if (!listEl) return;

    if (this.items.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; color:#94a3b8; padding:40px 0;">
          <p style="font-size: 14px;">Your cart is empty.</p>
        </div>
      `;
      this.renderTotals();
      return;
    }

    const LOCAL_IMAGE_MAP = {
      'singhara-pasta-macaroni': 'assets/images/products/pasta-macaroni-1.png',
      'singhara-vermicell': 'assets/images/products/vermicelli-1.png',
      'singhara-atta': 'assets/images/products/atta-1.png',
      'fresh-singhara': 'assets/images/products/fresh-singhara-1.png',
      'dry-singhara': 'assets/images/products/dry-singhara-1.png',
      'singhara-snacks': 'assets/images/products/singhara-snacks-1.png'
    };

    listEl.innerHTML = this.items.map(item => {
      let imgSrc = item.image;
      if (!imgSrc && item.handle) {
        imgSrc = LOCAL_IMAGE_MAP[item.handle];
      }
      if (!imgSrc) {
        const nameLower = item.name.toLowerCase();
        if (nameLower.includes('macaroni') || nameLower.includes('pasta')) imgSrc = LOCAL_IMAGE_MAP['singhara-pasta-macaroni'];
        else if (nameLower.includes('vermicelli')) imgSrc = LOCAL_IMAGE_MAP['singhara-vermicell'];
        else if (nameLower.includes('atta') || nameLower.includes('flour')) imgSrc = LOCAL_IMAGE_MAP['singhara-atta'];
        else if (nameLower.includes('fresh')) imgSrc = LOCAL_IMAGE_MAP['fresh-singhara'];
        else if (nameLower.includes('dry')) imgSrc = LOCAL_IMAGE_MAP['dry-singhara'];
        else if (nameLower.includes('snack')) imgSrc = LOCAL_IMAGE_MAP['singhara-snacks'];
      }
      
      const finalSrc = imgSrc ? window.MantraaqAPI.resolveImageUrl(imgSrc) : 'https://placehold.co/100?text=MantraAQ';

      return `
      <div class="cart-item">
        <img src="${MantraAQSanitizeURL(finalSrc)}" alt="${MantraAQSanitize(item.name)}" class="cart-item-img" onerror="this.src='https://placehold.co/100?text=MantraAQ'" />
        <div class="cart-item-details">
          <div>
            <h4 class="cart-item-title">${MantraAQSanitize(item.name)}</h4>
            <p class="cart-item-variant">Pack: ${MantraAQSanitize(item.title)}</p>
          </div>
          <div class="cart-item-row">
            <div class="qty-selectors">
              <button class="qty-btn" onclick="Cart.updateQuantity('${item.variantId}', ${item.quantity - 1})">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" onclick="Cart.updateQuantity('${item.variantId}', ${item.quantity + 1})">+</button>
            </div>
            <span class="cart-item-price">₹${(item.price * item.quantity).toFixed(0)}</span>
          </div>
          <button class="cart-item-remove" onclick="Cart.removeItem('${item.variantId}')">Remove</button>
        </div>
      </div>
      `;
    }).join('');

    this.renderCouponUI(!!this.appliedCoupon);
  },

  // Triggered when checkout form is submitted
  async handleCheckoutSubmit(e) {
    e.preventDefault();
    const paySubmitBtn = document.getElementById('paySubmitBtn');

    // ── LOGIN GATE: Checkout requires authentication ──────────
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
      window.Toast.warning('Login Required: Please sign in before placing an order.');
      if (window.CustomerAuth) {
        window.CustomerAuth.open();
      }
      return;
    }

    // Verify pincode format (6 digits)
    const shipPostal = document.getElementById('shipPostal');
    const pin = shipPostal ? shipPostal.value.trim() : '';
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      window.Toast.error('Please enter a valid 6-digit Indian PIN Code.');
      if (shipPostal) shipPostal.focus();
      return;
    }

    const shippingAddress = {
      name: document.getElementById('shipName').value.trim(),
      email: document.getElementById('shipEmail').value.trim(),
      phone: document.getElementById('shipPhone').value.trim(),
      street: document.getElementById('shipStreet').value.trim(),
      city: document.getElementById('shipCity').value.trim(),
      state: document.getElementById('shipState').value.trim(),
      postalCode: document.getElementById('shipPostal').value.trim(),
      clientUrl: window.location.origin,
    };

    const checkoutItems = this.items.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    const couponCode = this.appliedCoupon ? this.appliedCoupon.code : undefined;
    const paymentMethod = this.getSelectedPaymentMethod();
    let checkoutOrder = null;

    paySubmitBtn.disabled = true;
    paySubmitBtn.textContent = 'Validating stock...';

    try {
      // ── REAL-TIME STOCK RE-VALIDATION ──────────────────────
      // Fetch latest stock from server to prevent stale cart data issues
      try {
        const freshProducts = await window.MantraaqAPI.fetchProducts();
        if (freshProducts && freshProducts.length > 0) {
          let stockIssue = false;
          for (const item of this.items) {
            const product = freshProducts.find(p => p.id === item.productId);
            if (!product || !product.isActive) {
              window.Toast.error(`Unavailable: "${item.name}" is no longer available.`);
              stockIssue = true;
              break;
            }
            const variant = product.variants.find(v => v.id === item.variantId);
            if (!variant) {
              window.Toast.error(`Unavailable: "${item.name} (${item.title})" variant no longer exists.`);
              stockIssue = true;
              break;
            }
            if (variant.stockQuantity < item.quantity) {
              if (variant.stockQuantity === 0) {
                window.Toast.error(`Out of Stock: "${item.name} (${item.title})" is sold out.`);
              } else {
                window.Toast.error(`Inventory Limit: Only ${variant.stockQuantity} of "${item.name} (${item.title})" left.`);
              }
              // Update local cart stock
              item.stockQuantity = variant.stockQuantity;
              stockIssue = true;
              break;
            }
          }
          // Sync stock and remove out-of-stock items
          this.syncStock(freshProducts);
          if (stockIssue) {
            return;
          }
        }
      } catch (stockErr) {
        console.warn('Pre-checkout stock check failed, proceeding with server validation:', stockErr);
      }

      paySubmitBtn.textContent = 'Processing...';

      // Create payment order on backend API
      checkoutOrder = await window.MantraaqAPI.createPaymentOrder({
        items: checkoutItems,
        shippingAddress,
        couponCode,
        paymentMethod,
      });

      if (!checkoutOrder || !checkoutOrder.success) {
        window.Toast.error(checkoutOrder?.message || 'Transaction Failed: Failed to place checkout order.');
        return;
      }

      if (checkoutOrder.cod) {
        Cart.clear();
        Cart.close();
        window.Toast.success('Order Placed: Cash on Delivery order registered successfully.');
        if (window.CustomerAuth) {
          window.CustomerAuth.open();
        }
        return;
      }

      const payuConfig = checkoutOrder.payuConfig;

      paySubmitBtn.textContent = 'Redirecting to PayU...';

      // Determine Hosted Payment Checkout endpoint URL based on sandbox config
      const payuUrl = payuConfig.sandbox 
        ? 'https://test.payu.in/_payment' 
        : 'https://secure.payu.in/_payment';

      // Create a hidden form and submit it to PayU (Standard browser redirection)
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payuUrl;

      for (const key in payuConfig) {
        if (key !== 'sandbox' && payuConfig[key] !== undefined && payuConfig[key] !== null) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = payuConfig[key];
          form.appendChild(input);
        }
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error('Checkout submit error:', err);
      window.Toast.error(err.message || 'Transaction Failed: Inventory or server connection issue.');
      try {
        if (checkoutOrder && checkoutOrder.orderId) {
          await window.MantraaqAPI.cancelOrder(checkoutOrder.orderId);
        }
      } catch (cErr) {
        console.error('Auto-cancel order error:', cErr);
      }
    } finally {
      paySubmitBtn.disabled = false;
      paySubmitBtn.textContent = 'Proceed to Payment';
    }
  },

  async fetchAndRenderCoupons() {
    const loader = document.getElementById('couponsLoadingIndicator');
    if (loader) loader.style.display = 'inline';

    try {
      const coupons = await window.MantraaqAPI.fetchActiveCoupons();
      this.activeCouponsList = coupons || [];
    } catch (err) {
      console.error('Error loading coupons:', err);
    } finally {
      if (loader) loader.style.display = 'none';
    }
    const countEl = document.getElementById('couponsAccordionTitle');
    if (countEl) {
      countEl.textContent = `Available Coupons (${this.activeCouponsList.length})`;
    }
    this.renderCouponsList();
  },

  renderCouponsList() {
    const listContainer = document.getElementById('availableCouponsList');
    if (!listContainer) return;

    if (!this.activeCouponsList || this.activeCouponsList.length === 0) {
      listContainer.innerHTML = `<div style="font-size:11px; color:#94a3b8; text-align:center; padding:10px 0;">No active coupons available right now.</div>`;
      return;
    }

    const subtotal = this.getTotal();
    listContainer.innerHTML = this.activeCouponsList.map(c => {
      const isApplied = this.appliedCoupon && this.appliedCoupon.code.toUpperCase() === c.code.toUpperCase();
      const cardClass = isApplied ? 'coupon-item-card applied' : 'coupon-item-card';
      const actionText = isApplied ? 'Applied ✓' : 'Apply';
      
      let desc = `Get ₹${c.discountValue} off on your order`;
      if (c.code.toUpperCase() === 'WELCOME75') {
        desc = `Flat ₹75 off for first-time customers`;
      } else if (c.discountType === 'PERCENTAGE') {
        desc = `Get ${c.discountValue}% off on your order`;
      }
      const minAmt = c.minOrderAmount ? `Min order: ₹${c.minOrderAmount}` : 'No minimum order';

      const satisfiesMin = !c.minOrderAmount || subtotal >= c.minOrderAmount;
      const disabledStyle = satisfiesMin ? '' : 'opacity: 0.6; cursor: not-allowed;';
      const satisfiesText = satisfiesMin ? '' : ` <span style="color:#ef4444; font-size:10px; display:block; margin-top:2px;">(Add ₹${(c.minOrderAmount - subtotal).toFixed(0)} more)</span>`;

      return `
        <div class="${cardClass}" style="${disabledStyle}" onclick="${satisfiesMin ? `Cart.selectCoupon('${c.code}')` : ''}">
          <div class="coupon-card-header">
            <span class="coupon-code-badge">${MantraAQSanitize(c.code)}</span>
            <span class="coupon-apply-action">${actionText}</span>
          </div>
          <div class="coupon-card-desc">${desc}</div>
          <div class="coupon-card-min-order">${minAmt}${satisfiesText}</div>
        </div>
      `;
    }).join('');
  },

  selectCoupon(code) {
    const input = document.getElementById('cartCouponInput');
    if (input) {
      input.value = code;
      this.applyCoupon();
    }
  },

  toggleCouponsAccordion() {
    const list = document.getElementById('availableCouponsList');
    const arrow = document.getElementById('couponsAccordionArrow');
    if (!list || !arrow) return;

    if (list.style.display === 'none' || !list.style.display) {
      list.style.display = 'flex';
      arrow.style.transform = 'rotate(180deg)';
    } else {
      list.style.display = 'none';
      arrow.style.transform = 'rotate(0deg)';
    }
  },

  renderCheckoutSummary() {
    const listEl = document.getElementById('checkoutItemsList');
    if (!listEl) return;

    listEl.innerHTML = this.items.map(item => {
      return `
        <div class="checkout-summary-item">
          <span class="checkout-summary-item-name">${MantraAQSanitize(item.name)}</span>
          <span class="checkout-summary-item-qty">x${item.quantity}</span>
          <span class="checkout-summary-item-price">₹${(item.price * item.quantity).toFixed(0)}</span>
        </div>
      `;
    }).join('');
  }
};

// Mount to window
window.Cart = Cart;

// Init when page is ready
document.addEventListener('DOMContentLoaded', () => {
  Cart.init();
});
