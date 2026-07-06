/**
 * Mantraaq Storefront Product Syncing Script
 * Fully dynamic rendering of products from the admin/backend database.
 */

const PRODUCT_MAP = {
  'pasta-macaroni': 'singhara-pasta-macaroni',
  'vermicelli':     'singhara-vermicell',
  'atta':           'singhara-atta',
  'fresh':          'fresh-singhara',
  'dry':            'dry-singhara',
  'snacks':         'singhara-snacks'
};

// Fallback images for storefront products when database images array is empty
const LOCAL_IMAGE_FALLBACK = {
  'singhara-pasta-macaroni': ['assets/images/products/pasta-macaroni-1.png'],
  'singhara-vermicell':     ['assets/images/products/vermicelli-1.png'],
  'singhara-atta':           ['assets/images/products/atta-1.png'],
  'fresh-singhara':          ['assets/images/products/fresh-singhara-1.png'],
  'dry-singhara':            ['assets/images/products/dry-singhara-1.png'],
  'singhara-snacks':         ['assets/images/products/singhara-snacks-1.png']
};

// Store loaded products globally for variant lookups
let loadedProductsMap = {};

// Expose globally so other modules (wishlist, search) can access it
window._loadedProductsMap = loadedProductsMap;
window._PRODUCT_MAP = PRODUCT_MAP;

/**
 * Badge tag mapping — maps backend tag strings to CSS class + display label
 */
const TAG_BADGE_MAP = {
  'bestseller':  { cls: 'bestseller',  label: 'Bestseller' },
  'new-launch':  { cls: 'new',         label: 'New Launch' },
  'seasonal':    { cls: 'seasonal',    label: 'Seasonal' },
  'coming-soon': { cls: 'coming-soon', label: 'Coming Soon' },
};

/**
 * Build dynamic feature tags with emojis
 */
function buildFeatureTags(product) {
  const badgeTags = ['bestseller', 'new-launch', 'seasonal', 'coming-soon'];
  const features = (product.tags || []).filter(t => !badgeTags.includes(t.toLowerCase().replace(/\s+/g, '-')));
  
  if (features.length === 0) {
    return '';
  }

  const emojiMap = {
    'gluten-free': '🌾',
    'cold-processed': '❄️',
    'qr-traced': '📱',
    '100%-natural': '🌿',
    'high-protein': '💪',
    'premium-quality': '⭐',
    'stone-ground': '🪨',
    'multi-purpose': '📦',
    'high-fiber': '🌾',
    'farm-direct': '🚜',
    '48hr-delivery': '⚡',
    'fresh-&-juicy': '🍉',
    'sun-dried': '☀️',
    'long-shelf-life': '🥫',
    'versatile': '🥣',
    'diabetic-friendly': '🥗',
    'clean-ingredients': '🍃'
  };

  return features.slice(0, 3).map(f => {
    const key = f.toLowerCase().replace(/\s+/g, '-');
    const emoji = emojiMap[key] || '🏷️';
    return `<span class="feature-tag">${emoji} ${f}</span>`;
  }).join('');
}

/**
 * Build dynamic badge overlay HTML
 */
function buildBadgeHTML(product) {
  const tags = product.tags || [];
  let html = '';
  tags.forEach(tag => {
    const tagKey = tag.toLowerCase().replace(/\s+/g, '-');
    const mapped = TAG_BADGE_MAP[tagKey];
    if (mapped) {
      html += `<div class="product-badge ${mapped.cls}">${mapped.label}</div>`;
    }
  });
  return html;
}

/**
 * Check if a product is marked as "Coming Soon"
 */
function isComingSoon(product) {
  const tags = (product.tags || []).map(t => t.toLowerCase().replace(/\s+/g, '-'));
  return tags.includes('coming-soon');
}

/**
 * Render dynamic weight pills/selectors for variants
 */
function buildVariantSelector(variants, handle, selectedVariantId) {
  if (!variants || variants.length === 0) return '';
  
  if (variants.length === 1) {
    return `
      <div class="variant-selector" data-handle="${handle}">
        <span class="variant-btn active" style="cursor:default; padding: 5px 12px; border-radius: 6px; font-size: 11px; background: rgba(15, 81, 50, 0.08); color: #0f5132; font-weight: 600; display: inline-block;">
          ${variants[0].title}
        </span>
      </div>`;
  }

  return `
    <div class="variant-selector flex gap-2 flex-wrap" data-handle="${handle}">
      ${variants.map(v => {
        const isActive = v.id === selectedVariantId;
        return `
        <button
          type="button"
          class="variant-btn border rounded-lg px-3 py-1 text-xs transition-all ${
            isActive ? 'active font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold'
          } ${v.stockQuantity === 0 ? 'opacity-40 line-through cursor-not-allowed' : ''}"
          data-variant-id="${v.id}"
          data-price="${v.price}"
          data-compare="${v.compareAtPrice || ''}"
          data-stock="${v.stockQuantity}"
          ${v.stockQuantity === 0 ? 'disabled' : ''}
          title="${v.stockQuantity === 0 ? 'Out of Stock' : v.title}">
          ${v.title}
        </button>
        `;
      }).join('')}
    </div>`;
}

/**
 * Update pricing display inside a card
 */
function updatePriceDisplay(card, price, compareAt) {
  const priceEl = card.querySelector('.price-current');
  const pw = card.querySelector('.price-wrapper');
  if (!priceEl || !pw) return;

  priceEl.textContent = `₹${parseFloat(price).toFixed(0)}`;

  // Clear existing comparison details
  pw.querySelectorAll('.price-original, .price-discount').forEach(el => el.remove());

  if (compareAt && parseFloat(compareAt) > parseFloat(price)) {
    const discount = Math.round(((compareAt - price) / compareAt) * 100);
    pw.insertAdjacentHTML('beforeend', `
      <span class="price-original">₹${parseFloat(compareAt).toFixed(0)}</span>
      <span class="price-discount">${discount}% OFF</span>
    `);
  }
}

/**
 * Wire up click events for product gallery inside a card
 */
function initCardGallery(card, product) {
  const images = card.querySelectorAll('.product-img');
  const indicators = card.querySelectorAll('.indicator');
  const prevBtn = card.querySelector('.gallery-nav.prev');
  const nextBtn = card.querySelector('.gallery-nav.next');
  
  if (images.length <= 1) return;
  
  let currentIndex = 0;
  let autoPlayInterval = null;
  let userInteractionTimeout = null;
  let isHovered = false;
  
  function goToImage(index) {
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    
    images.forEach((img, i) => {
      img.classList.toggle('active', i === index);
    });
    
    indicators.forEach((ind, i) => {
      ind.classList.toggle('active', i === index);
    });
    
    currentIndex = index;
  }
  
  function startAutoPlay() {
    stopAutoPlay();
    if (isHovered) return;
    autoPlayInterval = setInterval(() => {
      goToImage(currentIndex + 1);
    }, 4000);
  }
  
  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }
  
  function handleUserInteraction() {
    stopAutoPlay();
    if (userInteractionTimeout) {
      clearTimeout(userInteractionTimeout);
    }
    userInteractionTimeout = setTimeout(() => {
      startAutoPlay();
    }, 8000); // Resume autoplay after 8s of inactivity
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToImage(currentIndex - 1);
      handleUserInteraction();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToImage(currentIndex + 1);
      handleUserInteraction();
    });
  }
  
  indicators.forEach((ind, idx) => {
    ind.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToImage(idx);
      handleUserInteraction();
    });
  });

  // Pause on hover
  card.addEventListener('mouseenter', () => {
    isHovered = true;
    stopAutoPlay();
    if (userInteractionTimeout) {
      clearTimeout(userInteractionTimeout);
      userInteractionTimeout = null;
    }
  });
  
  card.addEventListener('mouseleave', () => {
    isHovered = false;
    startAutoPlay();
  });
  
  // Start the slideshow automatically
  startAutoPlay();
}

/**
 * Fetch products and dynamically build the products grid
 */
async function syncProductCards() {
  const gridContainer = document.getElementById('storefront-products-grid');
  if (!gridContainer) return;

  let products;
  try {
    products = await window.MantraaqAPI.fetchProducts();
  } catch (e) {
    console.warn('Storefront: Could not fetch products', e);
    gridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #94a3b8;">Unable to load products. Please check connection.</div>`;
    return;
  }

  if (!products || products.length === 0) {
    gridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #94a3b8;">No products found in the database.</div>`;
    return;
  }

  // Filter for active products
  const activeProducts = products.filter(p => p.isActive !== false && p.variants && p.variants.length > 0);

  // Index active products globally
  loadedProductsMap = {};
  activeProducts.forEach(p => {
    loadedProductsMap[p.handle] = p;
  });
  window._loadedProductsMap = loadedProductsMap;

  // Sync cart items with fetched product stock levels
  if (window.Cart && typeof window.Cart.syncStock === 'function') {
    window.Cart.syncStock(products);
  }

  // Render cards
  gridContainer.innerHTML = activeProducts.map(product => {
    // Map database handle back to static keys if wishlist/search expects it
    let productKey = product.handle;
    for (const [key, handle] of Object.entries(PRODUCT_MAP)) {
      if (handle === product.handle) {
        productKey = key;
        break;
      }
    }

    const defaultVariant = product.variants.find(v => v.stockQuantity > 0) || product.variants[0];
    const imageFallback = LOCAL_IMAGE_FALLBACK[product.handle] || ['assets/images/placeholder.png'];
    const galleryImages = product.images && product.images.length > 0 ? product.images : imageFallback;

    return `
      <div class="product-card" data-product="${productKey}">
        <div class="product-image-wrapper">
          ${buildBadgeHTML(product)}
          
          <!-- Product Image Gallery -->
          <div class="product-gallery">
            ${galleryImages.map((imgUrl, idx) => `
              <img src="${window.MantraaqAPI.resolveImageUrl(imgUrl)}" alt="${product.name}" class="product-img ${idx === 0 ? 'active' : ''}" data-index="${idx}">
            `).join('')}
          </div>

          <!-- Gallery Navigation Controls -->
          ${galleryImages.length > 1 ? `
            <button type="button" class="gallery-nav prev" aria-label="Previous image">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <button type="button" class="gallery-nav next" aria-label="Next image">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            <div class="gallery-indicators">
              ${galleryImages.map((_, idx) => `
                <span class="indicator ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div class="product-content">
          <div class="product-header">
              <h3 class="product-title">${product.name}</h3>
          </div>

          <p class="product-description">${product.description || ''}</p>

          <!-- Dynamic feature badges -->
          <div class="product-features">
            ${buildFeatureTags(product)}
          </div>

          <!-- Dynamic variant selector pills -->
          <div class="variant-selector-container">
            ${buildVariantSelector(product.variants, product.handle, defaultVariant.id)}
          </div>

          <div class="product-footer">
              <div class="price-wrapper">
                  <span class="price-current">₹0</span>
              </div>
              <div class="tax-label">Inclusive of all taxes</div>
          </div>

          <button type="button" class="btn-primary">
              <span>Buy Now</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 01-8 0"></path>
              </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach card behaviors (variant selector, pricing, buy button, and gallery navigation)
  document.querySelectorAll('.product-card').forEach(card => {
    const key = card.getAttribute('data-product');
    const handle = PRODUCT_MAP[key] || key;
    const product = loadedProductsMap[handle];
    if (!product) return;

    const defaultVariant = product.variants.find(v => v.stockQuantity > 0) || product.variants[0];
    let selectedVariant = defaultVariant;

    // Initialize gallery behavior
    initCardGallery(card, product);

    // Initial pricing display sync
    updatePriceDisplay(card, defaultVariant.price, defaultVariant.compareAtPrice);

    // Hook variant button selection
    card.querySelectorAll('.variant-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (btn.dataset.stock === '0') return;

        // Reset siblings layout
        card.querySelectorAll('.variant-btn').forEach(b => {
          const isOutOfStock = b.getAttribute('data-stock') === '0';
          b.className = `variant-btn border rounded-lg px-3 py-1 text-xs font-semibold transition-all border-slate-200 text-slate-500 hover:bg-slate-50 ${isOutOfStock ? 'opacity-40 line-through cursor-not-allowed' : ''}`;
        });

        // Set active button styles
        btn.className = `variant-btn border rounded-lg px-3 py-1 text-xs font-bold transition-all active`;

        const variantId = btn.dataset.variantId;
        selectedVariant = product.variants.find(v => v.id === variantId);

        updatePriceDisplay(card, selectedVariant.price, selectedVariant.compareAtPrice);
      });
    });

    // Hook buy button click handler
    const buyBtn = card.querySelector('.btn-primary');
    if (buyBtn) {
      buyBtn.style.cursor = 'pointer';

      // ── COMING SOON BADGE LOCK ──
      if (isComingSoon(product)) {
        buyBtn.innerHTML = `<span>Coming Soon</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>`;
        buyBtn.classList.add('coming-soon-disabled');
        return; 
      }

      // ── OUT OF STOCK LOCK ──
      const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
      if (totalStock === 0) {
        buyBtn.innerHTML = `<span>Out of Stock</span>`;
        buyBtn.classList.add('coming-soon-disabled');
      } else {
        buyBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (selectedVariant) {
            // Re-check stock to guard against stale UI
            if (selectedVariant.stockQuantity !== undefined && selectedVariant.stockQuantity <= 0) {
              window.Toast.error(`Out of Stock: "${product.name} (${selectedVariant.title})" is sold out.`);
              return;
            }
            window.Cart.addItem(selectedVariant, product, 1);
          }
        });
      }
    }
  });

  // Dispatch global event for other modules (wishlist, search) to notice load
  window.dispatchEvent(new CustomEvent('storefront:synced'));

  // Trigger wishlist sync directly as well
  if (window.Wishlist && typeof window.Wishlist.syncProductHearts === 'function') {
    window.Wishlist.syncProductHearts();
  }
}

// Initialize storefront updates
document.addEventListener('DOMContentLoaded', () => {
  syncProductCards();
});
