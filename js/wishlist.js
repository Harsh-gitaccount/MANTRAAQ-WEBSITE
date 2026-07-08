/**
 * Mantraaq Wishlist Module
 * Self-contained: injects its own CSS + HTML, exposes window.Wishlist
 */
(function () {
  'use strict';

  // ── PRODUCT_MAP mirror (same as storefront.js) ─────────────────
  const PRODUCT_MAP = {
    'pasta-macaroni': 'singhara-pasta-macaroni',
    'vermicelli': 'singhara-vermicell',
    'atta': 'singhara-atta',
    'fresh': 'fresh-singhara',
    'dry': 'dry-singhara',
    'snacks': 'singhara-snacks'
  };

  // ── LOCAL STATE ────────────────────────────────────────────────
  const GUEST_WISHLIST_KEY = 'mantraaq_guest_wishlist';
  let wishlistProductIds = new Set(); // product IDs currently wishlisted
  let wishlistItems = [];             // full items array from API
  let isFetching = false;

  // ── INJECT STYLES ──────────────────────────────────────────────
  const styles = `
    /* ═══════════════════════════════════════
       WISHLIST HEART BUTTON ON PRODUCT CARDS
    ═══════════════════════════════════════ */
    .wl-heart-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 15;
      width: 38px;
      height: 38px;
      border: none;
      border-radius: 50%;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.10);
      transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
      padding: 0;
      outline: none;
    }
    .wl-heart-btn:hover {
      transform: scale(1.15);
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      background: rgba(255,255,255,0.95);
    }
    .wl-heart-btn:active {
      transform: scale(0.92);
    }
    .wl-heart-btn svg {
      width: 20px;
      height: 20px;
      transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
      pointer-events: none;
    }
    .wl-heart-btn .wl-heart-outline {
      color: #6b7280;
    }
    .wl-heart-btn:hover .wl-heart-outline {
      color: #ef4444;
    }
    .wl-heart-btn .wl-heart-filled {
      display: none;
      color: #ef4444;
      filter: drop-shadow(0 0 6px rgba(239,68,68,0.4));
    }
    .wl-heart-btn.active .wl-heart-outline {
      display: none;
    }
    .wl-heart-btn.active .wl-heart-filled {
      display: block;
    }

    /* Pop animation on toggle */
    @keyframes wlHeartPop {
      0%   { transform: scale(1); }
      30%  { transform: scale(1.35); }
      60%  { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    .wl-heart-btn.wl-pop {
      animation: wlHeartPop 0.5s cubic-bezier(0.16,1,0.3,1);
    }

    /* Burst particles on wishlist add */
    .wl-heart-btn .wl-burst {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    @keyframes wlBurst {
      0%   { opacity: 1; transform: scale(0.5); }
      100% { opacity: 0; transform: scale(2.2); }
    }
    .wl-heart-btn .wl-burst-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid rgba(239,68,68,0.5);
      opacity: 0;
    }
    .wl-heart-btn.wl-pop .wl-burst-ring {
      animation: wlBurst 0.55s cubic-bezier(0.16,1,0.3,1) forwards;
    }

    /* ═══════════════════════════════════════
       WISHLIST DRAWER OVERLAY
    ═══════════════════════════════════════ */
    .wl-overlay {
      position: fixed;
      inset: 0;
      background: rgba(3,10,5,0.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
    }
    .wl-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    /* Drawer Panel */
    .wl-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: 420px;
      background: linear-gradient(180deg, #030a05 0%, #07170c 100%);
      box-shadow: -10px 0 40px rgba(0,0,0,0.5);
      z-index: 1001;
      transform: translateX(100%);
      transition: transform 0.45s cubic-bezier(0.16,1,0.3,1);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      border-left: 1px solid rgba(74,222,128,0.08);
    }
    .wl-overlay.active .wl-drawer {
      transform: translateX(0);
    }

    /* Header */
    .wl-hdr {
      padding: 24px;
      border-bottom: 1px solid rgba(74,222,128,0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(3,10,5,0.5);
    }
    .wl-hdr-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .wl-hdr-icon {
      color: #ef4444;
      display: flex;
    }
    .wl-hdr h2 {
      font-size: 18px;
      font-weight: 700;
      color: #f0fdf4;
      margin: 0;
      letter-spacing: -0.01em;
    }
    .wl-hdr-count {
      font-size: 12px;
      color: #4ade80;
      font-weight: 600;
      background: rgba(74,222,128,0.1);
      padding: 2px 8px;
      border-radius: 20px;
    }
    .wl-close-btn {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      width: 36px;
      height: 36px;
      border-radius: 10px;
      font-size: 18px;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s ease;
    }
    .wl-close-btn:hover {
      background: rgba(239,68,68,0.1);
      border-color: rgba(239,68,68,0.2);
      color: #ef4444;
    }

    /* Items List */
    .wl-items-list {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scrollbar-width: auto;
      scrollbar-color: #10b981 rgba(255, 255, 255, 0.05);
    }
    .wl-items-list::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    .wl-items-list::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
    }
    .wl-items-list::-webkit-scrollbar-thumb {
      background: linear-gradient(to bottom, #4ade80, #10b981);
      border-radius: 6px;
      border: 2px solid #030a05; /* Matches wishlist drawer background */
    }
    .wl-items-list::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(to bottom, #22c55e, #10b981);
    }

    /* Single Wishlist Item */
    .wl-item {
      display: flex;
      gap: 14px;
      padding: 14px;
      border-radius: 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      transition: all 0.3s ease;
    }
    .wl-item:hover {
      background: rgba(74,222,128,0.04);
      border-color: rgba(74,222,128,0.1);
    }
    .wl-item-img {
      width: 72px;
      height: 72px;
      border-radius: 10px;
      object-fit: cover;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }
    .wl-item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
    }
    .wl-item-name {
      font-size: 14px;
      font-weight: 600;
      color: #f0fdf4;
      margin: 0 0 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .wl-item-price-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-bottom: 10px;
    }
    .wl-item-price {
      font-size: 16px;
      font-weight: 700;
      color: #4ade80;
    }
    .wl-item-compare {
      font-size: 12px;
      color: #64748b;
      text-decoration: line-through;
    }
    .wl-item-actions {
      display: flex;
      gap: 8px;
    }
    .wl-btn-cart {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: none;
      color: #fff;
      padding: 7px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
      white-space: nowrap;
    }
    .wl-btn-cart:hover {
      box-shadow: 0 4px 14px rgba(16,185,129,0.3);
      transform: translateY(-1px);
    }
    .wl-btn-cart svg { width: 14px; height: 14px; pointer-events: none; }
    .wl-btn-remove {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.12);
      border-radius: 8px;
      color: #ef4444;
      cursor: pointer;
      transition: all 0.25s ease;
      flex-shrink: 0;
    }
    .wl-btn-remove:hover {
      background: rgba(239,68,68,0.15);
      border-color: rgba(239,68,68,0.25);
      transform: scale(1.05);
    }
    .wl-btn-remove svg { width: 15px; height: 15px; pointer-events: none; }

    /* Empty state */
    .wl-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;
    }
    .wl-empty-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(239,68,68,0.06);
      border: 1px solid rgba(239,68,68,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .wl-empty-icon svg {
      width: 32px;
      height: 32px;
      color: rgba(239,68,68,0.35);
    }
    .wl-empty-title {
      font-size: 16px;
      font-weight: 700;
      color: #f0fdf4;
      margin: 0 0 8px;
    }
    .wl-empty-sub {
      font-size: 13px;
      color: #4b5563;
      margin: 0 0 24px;
      line-height: 1.6;
    }
    .wl-empty-cta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      color: #fff;
      padding: 10px 24px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .wl-empty-cta:hover {
      box-shadow: 0 6px 20px rgba(16,185,129,0.3);
      transform: translateY(-2px);
    }

    /* ═══════════════════════════════════════
       WISHLIST NAV BADGE
    ═══════════════════════════════════════ */
    .wishlist-badge {
      background: #ef4444;
      color: white;
      font-size: 9px;
      font-weight: 800;
      border-radius: 999px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      display: none;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: -4px;
      right: -6px;
      line-height: 1;
      box-shadow: 0 2px 6px rgba(239,68,68,0.35);
      pointer-events: none;
    }

    /* Loading shimmer */
    .wl-loading {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
    }
    .wl-shimmer {
      height: 80px;
      border-radius: 14px;
      background: linear-gradient(
        90deg,
        rgba(255,255,255,0.03) 25%,
        rgba(255,255,255,0.06) 50%,
        rgba(255,255,255,0.03) 75%
      );
      background-size: 200% 100%;
      animation: wlShimmer 1.5s ease-in-out infinite;
    }
    @keyframes wlShimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Item remove animation */
    .wl-item.wl-removing {
      opacity: 0;
      transform: translateX(40px);
      transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
    }

    /* Responsive */
    @media (max-width: 480px) {
      .wl-drawer { max-width: 100%; }
      .wl-item { padding: 12px; gap: 10px; }
      .wl-item-img { width: 60px; height: 60px; }
      .wl-heart-btn { width: 34px; height: 34px; top: 10px; right: 10px; }
      .wl-heart-btn svg { width: 17px; height: 17px; }
    }

    /* Promo Banner */
    .wl-promo-banner {
      background: rgba(74, 222, 128, 0.05);
      border-bottom: 1px solid rgba(74, 222, 128, 0.12);
      padding: 14px 20px;
      font-size: 12px;
      color: #a7f3d0;
      line-height: 1.5;
      display: none;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .wl-promo-text {
      flex: 1;
    }
    .wl-promo-link {
      background: rgba(74, 222, 128, 0.12);
      border: 1px solid rgba(74, 222, 128, 0.25);
      color: #4ade80;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.25s ease;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .wl-promo-link:hover {
      background: rgba(74, 222, 128, 0.20);
      color: #fff;
      box-shadow: 0 0 10px rgba(74, 222, 128, 0.2);
    }

    /* Variant dropdown in wishlist drawer */
    .wl-item-variant-select {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      color: #e2e8f0;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 22px 4px 8px;
      margin-top: 4px;
      margin-bottom: 8px;
      width: 100%;
      cursor: pointer;
      outline: none;
      transition: all 0.25s ease;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234ade80'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 6px center;
      background-size: 10px;
    }
    .wl-item-variant-select:hover {
      background-color: rgba(255, 255, 255, 0.08);
      border-color: rgba(74, 222, 128, 0.2);
    }
    .wl-item-variant-select option {
      background: #07170c;
      color: #e2e8f0;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // ── SVG TEMPLATES ──────────────────────────────────────────────
  const HEART_OUTLINE_SVG = `<svg class="wl-heart-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`;
  const HEART_FILLED_SVG = `<svg class="wl-heart-filled" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`;
  const CART_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`;
  const TRASH_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;

  // ── HELPERS ────────────────────────────────────────────────────
  function isLoggedIn() {
    return !!localStorage.getItem('user_token');
  }

  function getProductsMap() {
    return window._loadedProductsMap || {};
  }

  /** Look up the product ID for a given card's data-product key */
  function getProductIdFromCard(card) {
    const key = card.getAttribute('data-product');
    if (!key) return null;
    const handle = PRODUCT_MAP[key];
    if (!handle) return null;
    const productsMap = getProductsMap();
    const product = productsMap[handle];
    return product ? product.id : null;
  }

  /** Find the full product data for a given product id */
  function getProductById(productId) {
    const productsMap = getProductsMap();
    for (const handle in productsMap) {
      if (productsMap[handle].id === productId) return productsMap[handle];
    }
    return null;
  }

  // ── BADGE ──────────────────────────────────────────────────────
  function updateBadge() {
    const count = wishlistProductIds.size;
    document.querySelectorAll('[data-action="wishlist"]').forEach(el => {
      // Ensure element has position for absolute badge
      if (getComputedStyle(el).position === 'static') {
        el.style.position = 'relative';
      }
      let badge = el.querySelector('.wishlist-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'wishlist-badge';
        el.appendChild(badge);
      }
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  // ── HEART ICONS ON PRODUCT CARDS ───────────────────────────────
  function injectHearts() {
    document.querySelectorAll('.product-card[data-product]').forEach(card => {
      const wrapper = card.querySelector('.product-image-wrapper');
      if (!wrapper || wrapper.querySelector('.wl-heart-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'wl-heart-btn';
      btn.setAttribute('aria-label', 'Toggle wishlist');
      btn.setAttribute('type', 'button');
      btn.innerHTML = `
        ${HEART_OUTLINE_SVG}
        ${HEART_FILLED_SVG}
        <span class="wl-burst"><span class="wl-burst-ring"></span></span>
      `;

      // Check if already wishlisted
      const productId = getProductIdFromCard(card);
      if (productId && wishlistProductIds.has(productId)) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleHeartClick(btn, card);
      });

      wrapper.appendChild(btn);
    });
  }

  function syncHeartStates() {
    document.querySelectorAll('.product-card[data-product]').forEach(card => {
      const btn = card.querySelector('.wl-heart-btn');
      if (!btn) return;
      const productId = getProductIdFromCard(card);
      if (!productId) return;

      if (wishlistProductIds.has(productId)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  async function handleHeartClick(btn, card) {
    const productId = getProductIdFromCard(card);
    if (!productId) return;

    const isWishlisted = wishlistProductIds.has(productId);

    // Optimistic UI
    btn.classList.toggle('active');
    triggerPopAnimation(btn);

    if (isLoggedIn()) {
      try {
        if (isWishlisted) {
          await window.MantraaqAPI.removeFromWishlist(productId);
          wishlistProductIds.delete(productId);
          wishlistItems = wishlistItems.filter(i => i.productId !== productId);
          if (window.Toast) window.Toast.success('Wishlist Updated: Item removed.');
        } else {
          await window.MantraaqAPI.addToWishlist(productId);
          wishlistProductIds.add(productId);
          // Add a temporary item entry for badge/drawer
          const product = getProductById(productId);
          if (product) {
            wishlistItems.unshift({
              productId: product.id,
              name: product.name,
              handle: product.handle,
              image: product.images && product.images[0] ? product.images[0] : null,
              price: product.variants && product.variants[0] ? product.variants[0].price : 0,
              compareAtPrice: product.variants && product.variants[0] ? product.variants[0].compareAtPrice : null,
              addedAt: new Date().toISOString()
            });
          }
          if (window.Toast) window.Toast.success('Wishlist Updated: Item saved.');
        }
      } catch (err) {
        // Revert on failure
        btn.classList.toggle('active');
        if (window.Toast) window.Toast.error(err.message || 'Wishlist Error: Failed to update wishlist.');
      }
    } else {
      // Guest wishlist toggle
      if (isWishlisted) {
        wishlistProductIds.delete(productId);
        wishlistItems = wishlistItems.filter(i => i.productId !== productId);
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlistItems));
        if (window.Toast) window.Toast.success('Wishlist Updated: Item removed.');
      } else {
        wishlistProductIds.add(productId);
        const product = getProductById(productId);
        if (product) {
          wishlistItems.unshift({
            productId: product.id,
            name: product.name,
            handle: product.handle,
            image: product.images && product.images[0] ? product.images[0] : null,
            price: product.variants && product.variants[0] ? product.variants[0].price : 0,
            compareAtPrice: product.variants && product.variants[0] ? product.variants[0].compareAtPrice : null,
            addedAt: new Date().toISOString()
          });
        }
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlistItems));
        if (window.Toast) window.Toast.success('Wishlist Updated: Item saved.');
      }
    }

    updateBadge();
    syncHeartStates();
    renderDrawerItems();
  }

  function triggerPopAnimation(btn) {
    btn.classList.remove('wl-pop');
    // Force reflow so the animation re-triggers
    void btn.offsetWidth;
    btn.classList.add('wl-pop');
    setTimeout(() => btn.classList.remove('wl-pop'), 550);
  }

  // ── DRAWER ─────────────────────────────────────────────────────
  function injectDrawer() {
    const html = `
      <div id="wlOverlay" class="wl-overlay">
        <div class="wl-drawer">
          <div class="wl-hdr">
            <div class="wl-hdr-left">
              <span class="wl-hdr-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              </span>
              <h2>My Wishlist</h2>
              <span class="wl-hdr-count" id="wlHdrCount">0</span>
            </div>
            <button class="wl-close-btn" id="wlCloseBtn" aria-label="Close wishlist">✕</button>
          </div>
          <div id="wlPromoBanner" class="wl-promo-banner">
            <span class="wl-promo-text">Log in to save your wishlist permanently and access it from any device.</span>
            <button class="wl-promo-link" id="wlPromoLoginBtn">Log In</button>
          </div>
          <div id="wlItemsList" class="wl-items-list"></div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    // Close button
    document.getElementById('wlCloseBtn').addEventListener('click', () => Wishlist.close());

    // Promo banner login button
    const promoLoginBtn = document.getElementById('wlPromoLoginBtn');
    if (promoLoginBtn) {
      promoLoginBtn.addEventListener('click', () => {
        Wishlist.close();
        if (window.CustomerAuth) {
          window.CustomerAuth.open();
        }
      });
    }

    // Click overlay to close
    document.getElementById('wlOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'wlOverlay') Wishlist.close();
    });

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const overlay = document.getElementById('wlOverlay');
        if (overlay && overlay.classList.contains('active')) Wishlist.close();
      }
    });
  }

  function renderDrawerItems() {
    const listEl = document.getElementById('wlItemsList');
    const countEl = document.getElementById('wlHdrCount');
    if (!listEl) return;

    const count = wishlistItems.length;
    if (countEl) countEl.textContent = count;

    const promoEl = document.getElementById('wlPromoBanner');
    if (promoEl) {
      if (!isLoggedIn() && count > 0) {
        promoEl.style.display = 'flex';
      } else {
        promoEl.style.display = 'none';
      }
    }

    if (count === 0) {
      listEl.innerHTML = `
        <div class="wl-empty">
          <div class="wl-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </div>
          <h3 class="wl-empty-title">Your wishlist is empty</h3>
          <p class="wl-empty-sub">Save your favourite products here<br>and come back to them anytime.</p>
          <button class="wl-empty-cta" id="wlBrowseBtn">
            Browse Products
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      `;
      const browseBtn = document.getElementById('wlBrowseBtn');
      if (browseBtn) {
        browseBtn.addEventListener('click', () => {
          Wishlist.close();
          const productsSection = document.getElementById('products');
          if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
        });
      }
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

    listEl.innerHTML = wishlistItems.map(item => {
      let imgPath = item.image;
      if (!imgPath && item.handle) {
        imgPath = LOCAL_IMAGE_MAP[item.handle];
      }
      if (!imgPath) {
        const nameLower = item.name.toLowerCase();
        if (nameLower.includes('macaroni') || nameLower.includes('pasta')) imgPath = LOCAL_IMAGE_MAP['singhara-pasta-macaroni'];
        else if (nameLower.includes('vermicelli')) imgPath = LOCAL_IMAGE_MAP['singhara-vermicell'];
        else if (nameLower.includes('atta') || nameLower.includes('flour')) imgPath = LOCAL_IMAGE_MAP['singhara-atta'];
        else if (nameLower.includes('fresh')) imgPath = LOCAL_IMAGE_MAP['fresh-singhara'];
        else if (nameLower.includes('dry')) imgPath = LOCAL_IMAGE_MAP['dry-singhara'];
        else if (nameLower.includes('snack')) imgPath = LOCAL_IMAGE_MAP['singhara-snacks'];
      }
      const imgSrc = imgPath ? window.MantraaqAPI.resolveImageUrl(imgPath) : 'https://placehold.co/100x100/07170c/4ade80?text=MantraAQ';
      
      const product = getProductById(item.productId);
      let variantSelectHtml = '';
      let displayPrice = item.price;
      let displayComparePrice = item.compareAtPrice;

      if (product && product.variants && product.variants.length > 0) {
        if (product.variants.length > 1) {
          variantSelectHtml = `
            <select class="wl-item-variant-select" data-wl-variant-select="${item.productId}">
              ${product.variants.map((v, idx) => `
                <option value="${v.id}" data-price="${v.price}" data-compare="${v.compareAtPrice || ''}" ${idx === 0 ? 'selected' : ''}>
                  ${MantraAQSanitize(v.title)} - ₹${parseFloat(v.price).toFixed(0)}
                </option>
              `).join('')}
            </select>
          `;
        } else {
          variantSelectHtml = `<p class="text-[11px] text-slate-500 mt-0.5 mb-1.5">${product.variants[0].title}</p>`;
        }
        const defaultVar = product.variants.find(v => v.stockQuantity > 0) || product.variants[0];
        displayPrice = defaultVar.price;
        displayComparePrice = defaultVar.compareAtPrice;
      }

      const priceStr = `₹${parseFloat(displayPrice).toFixed(0)}`;
      const compareStr = displayComparePrice && parseFloat(displayComparePrice) > parseFloat(displayPrice)
        ? `<span class="wl-item-compare">₹${parseFloat(displayComparePrice).toFixed(0)}</span>`
        : '';

      const isComingSoon = product && (product.tags || []).map(t => t.toLowerCase().replace(/\s+/g, '-')).includes('coming-soon');
      const cartBtnHtml = isComingSoon
        ? `
          <button class="wl-btn-cart wl-btn-cart-disabled" disabled style="background: rgba(148, 163, 184, 0.08); border-color: rgba(148, 163, 184, 0.15); color: #64748b; cursor: not-allowed;" title="Coming Soon">
            <span>Coming Soon</span>
          </button>
        `
        : `
          <button class="wl-btn-cart" data-wl-add-cart="${item.productId}" title="Add to Cart">
            ${CART_ICON_SVG}
            <span>Add to Cart</span>
          </button>
        `;

      return `
        <div class="wl-item" data-product-id="${item.productId}">
          <img src="${MantraAQSanitizeURL(imgSrc)}" alt="${MantraAQSanitize(item.name)}" class="wl-item-img"
               onerror="this.src='https://placehold.co/100x100/07170c/4ade80?text=MantraAQ'" />
          <div class="wl-item-details">
            <div>
              <h4 class="wl-item-name">${MantraAQSanitize(item.name)}</h4>
              ${variantSelectHtml}
              <div class="wl-item-price-row">
                <span class="wl-item-price">${priceStr}</span>
                ${compareStr}
              </div>
            </div>
            <div class="wl-item-actions">
              ${cartBtnHtml}
              <button class="wl-btn-remove" data-wl-remove="${item.productId}" title="Remove from wishlist">
                ${TRASH_ICON_SVG}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind variant select changes to update UI prices dynamically
    listEl.querySelectorAll('[data-wl-variant-select]').forEach(select => {
      select.addEventListener('change', (e) => {
        const selectEl = e.target;
        const selectedOption = selectEl.options[selectEl.selectedIndex];
        const price = parseFloat(selectedOption.getAttribute('data-price'));
        const compare = selectedOption.getAttribute('data-compare');
        
        const itemEl = selectEl.closest('.wl-item');
        if (itemEl) {
          const priceEl = itemEl.querySelector('.wl-item-price');
          const compareEl = itemEl.querySelector('.wl-item-compare');
          
          if (priceEl) priceEl.textContent = `₹${price.toFixed(0)}`;
          if (compareEl) {
            if (compare && parseFloat(compare) > price) {
              compareEl.textContent = `₹${parseFloat(compare).toFixed(0)}`;
              compareEl.style.display = '';
            } else {
              compareEl.style.display = 'none';
            }
          } else if (compare && parseFloat(compare) > price) {
            const priceRow = itemEl.querySelector('.wl-item-price-row');
            if (priceRow) {
              const newCompareEl = document.createElement('span');
              newCompareEl.className = 'wl-item-compare';
              newCompareEl.textContent = `₹${parseFloat(compare).toFixed(0)}`;
              priceRow.appendChild(newCompareEl);
            }
          }
        }
      });
    });

    // Bind action buttons
    listEl.querySelectorAll('[data-wl-add-cart]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pid = btn.getAttribute('data-wl-add-cart');
        const itemEl = btn.closest('.wl-item');
        let selectedVariantId = null;
        if (itemEl) {
          const selectEl = itemEl.querySelector('[data-wl-variant-select]');
          if (selectEl) {
            selectedVariantId = selectEl.value;
          }
        }
        handleAddToCartFromWishlist(pid, selectedVariantId);
      });
    });

    listEl.querySelectorAll('[data-wl-remove]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pid = btn.getAttribute('data-wl-remove');
        handleRemoveFromDrawer(pid, btn.closest('.wl-item'));
      });
    });
  }

  function showDrawerLoading() {
    const listEl = document.getElementById('wlItemsList');
    if (!listEl) return;
    listEl.innerHTML = `
      <div class="wl-loading">
        <div class="wl-shimmer"></div>
        <div class="wl-shimmer"></div>
        <div class="wl-shimmer"></div>
      </div>
    `;
  }

  function handleAddToCartFromWishlist(productId, variantId) {
    const product = getProductById(productId);
    if (!product || !product.variants || !product.variants.length) {
      if (window.Toast) window.Toast.error('Inventory Alert: Product unavailable.');
      return;
    }
    const tags = (product.tags || []).map(t => t.toLowerCase().replace(/\s+/g, '-'));
    if (tags.includes('coming-soon')) {
      if (window.Toast) window.Toast.error('Product Alert: This product is coming soon and cannot be added to the cart.');
      return;
    }
    let variant;
    if (variantId) {
      variant = product.variants.find(v => v.id === variantId);
    }
    if (!variant) {
      variant = product.variants.find(v => v.stockQuantity > 0) || product.variants[0];
    }
    if (variant.stockQuantity === 0) {
      if (window.Toast) window.Toast.error('Inventory Alert: Product is out of stock.');
      return;
    }
    if (window.Cart) {
      // Cart.addItem already triggers a Toast notification itself, so we don't repeat it here.
      window.Cart.addItem(variant, product, 1);
    }
  }

  async function handleRemoveFromDrawer(productId, itemEl) {
    // Animate out
    if (itemEl) itemEl.classList.add('wl-removing');

    if (isLoggedIn()) {
      try {
        await window.MantraaqAPI.removeFromWishlist(productId);
        wishlistProductIds.delete(productId);
        wishlistItems = wishlistItems.filter(i => i.productId !== productId);
        if (window.Toast) window.Toast.success('Wishlist Updated: Item removed.');
      } catch (err) {
        if (itemEl) itemEl.classList.remove('wl-removing');
        if (window.Toast) window.Toast.error(err.message || 'Wishlist Error: Failed to remove item.');
        return;
      }
    } else {
      wishlistProductIds.delete(productId);
      wishlistItems = wishlistItems.filter(i => i.productId !== productId);
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlistItems));
      if (window.Toast) window.Toast.success('Wishlist Updated: Item removed.');
    }

    // Wait for animation then re-render
    setTimeout(() => {
      updateBadge();
      syncHeartStates();
      renderDrawerItems();
    }, 350);
  }

  // ── FETCH & SYNC ───────────────────────────────────────────────
  async function syncGuestWishlistToDb() {
    let guestItems = [];
    try {
      const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
      guestItems = stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Error parsing guest wishlist:', err);
    }

    if (guestItems.length > 0) {
      for (const item of guestItems) {
        try {
          await window.MantraaqAPI.addToWishlist(item.productId);
        } catch (e) {
          console.error(`Failed to sync guest wishlist item ${item.productId}:`, e);
        }
      }
      localStorage.removeItem(GUEST_WISHLIST_KEY);
    }
  }

  async function fetchWishlist() {
    if (isLoggedIn()) {
      if (isFetching) return;
      isFetching = true;
      try {
        const items = await window.MantraaqAPI.getWishlist();
        wishlistItems = items || [];
        wishlistProductIds = new Set(wishlistItems.map(i => i.productId));
      } catch (err) {
        // Silently fail — user might not be authenticated
        wishlistItems = [];
        wishlistProductIds = new Set();
      }
      isFetching = false;
    } else {
      try {
        const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
        wishlistItems = stored ? JSON.parse(stored) : [];
      } catch (err) {
        wishlistItems = [];
      }
      wishlistProductIds = new Set(wishlistItems.map(i => i.productId));
    }
    updateBadge();
    syncHeartStates();
  }

  function clearState() {
    wishlistProductIds = new Set();
    wishlistItems = [];
    updateBadge();
    syncHeartStates();
    renderDrawerItems();
  }

  // ── PUBLIC API ─────────────────────────────────────────────────
  const Wishlist = {
    init() {
      injectDrawer();

      // Bind nav wishlist buttons
      document.querySelectorAll('[data-action="wishlist"]').forEach(el => {
        el.removeAttribute('href');
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
          e.preventDefault();
          Wishlist.open();
        });
      });

      // Initial fetch (unconditional to load guest/logged in state)
      fetchWishlist();

      // Inject hearts if products are already loaded
      if (window._loadedProductsMap && Object.keys(window._loadedProductsMap).length) {
        injectHearts();
      }

      updateBadge();
    },

    open() {
      const overlay = document.getElementById('wlOverlay');
      if (!overlay) return;
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Fetch fresh data
      if (isLoggedIn()) {
        showDrawerLoading();
        fetchWishlist().then(() => renderDrawerItems());
      } else {
        renderDrawerItems();
      }
    },

    close() {
      const overlay = document.getElementById('wlOverlay');
      if (!overlay) return;
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    },

    /** Call after storefront products are synced to place heart buttons */
    syncProductHearts() {
      injectHearts();
      syncHeartStates();
    },

    /** Re-fetch wishlist from API and update all UI */
    async refresh() {
      await fetchWishlist();
      renderDrawerItems();
    }
  };

  // ── MOUNT & EVENTS ─────────────────────────────────────────────
  window.Wishlist = Wishlist;

  document.addEventListener('DOMContentLoaded', () => {
    Wishlist.init();
  });

  // When storefront products finish loading
  window.addEventListener('storefront:synced', () => {
    Wishlist.syncProductHearts();
  });

  // On logout clear everything
  window.addEventListener('auth:logout', () => {
    clearState();
  });

  // On login/auth success, sync and re-fetch
  window.addEventListener('auth:login', () => {
    syncGuestWishlistToDb().then(() => {
      fetchWishlist().then(() => {
        syncHeartStates();
        renderDrawerItems();
      });
    });
  });

})();
