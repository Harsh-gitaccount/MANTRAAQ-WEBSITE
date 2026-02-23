// ─── CONFIG ───────────────────────────────────────────────────
const SHOPIFY_DOMAIN = 'shop.mantraaq.com';
const STOREFRONT_TOKEN = 'dc41840319c9f6fe674fbd77929d8b51';
const API_URL = `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`;

const PRODUCT_MAP = {
  'pasta-macaroni': 'singhara-pasta-macaroni',
  'vermicelli':     'singhara-vermicell',
  'atta':           'singhara-atta',
  'fresh':          'fresh-singhara',
  'dry':            'dry-singhara',
};

// ─── CORE FETCH ───────────────────────────────────────────────
async function shopifyFetch(query) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();
    if (json.errors) { console.error('Shopify:', json.errors); return null; }
    return json.data;
  } catch (err) {
    console.error('Shopify fetch error:', err);
    return null;
  }
}

// ─── FETCH ALL PRODUCTS ───────────────────────────────────────
async function fetchShopifyProducts() {
  const data = await shopifyFetch(`{
    products(first: 10) {
      edges {
        node {
          handle
          images(first: 3) {
            edges { node { url altText } }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                availableForSale
                quantityAvailable
                price { amount }
                compareAtPrice { amount }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  }`);

  const map = {};
  data?.products?.edges?.forEach(({ node }) => {
    const images = node.images.edges.map(e => e.node.url);

    const variants = node.variants.edges.map(e => {
      const price = parseFloat(e.node.price.amount);
      const compareAtRaw = e.node.compareAtPrice
        ? parseFloat(e.node.compareAtPrice.amount)
        : null;

      // ✅ Only use compareAt if actually greater than price (fixes Infinity bug)
      const compareAt = (compareAtRaw && compareAtRaw > price) ? compareAtRaw : null;
      const discount = compareAt
        ? Math.round(((compareAt - price) / compareAt) * 100)
        : null;

      // ✅ Get meaningful label — skip "Default Title"
      const meaningfulOption = e.node.selectedOptions.find(
        o => o.value !== 'Default Title' && o.value !== 'Title'
      );
      const label = meaningfulOption ? meaningfulOption.value : null;

      return {
        id: e.node.id,
        title: label,
        price,
        compareAt,
        discount,
        available: e.node.availableForSale,
        quantity: e.node.quantityAvailable,
      };
    });

    const anyAvailable = variants.some(v => v.available);
    const hasMultipleVariants = variants.length > 1 && variants[0].title !== null;

    map[node.handle] = {
      images,
      variants,
      anyAvailable,
      hasMultipleVariants,
    };
  });

  return map;
}

// ─── BUILD VARIANT SELECTOR ───────────────────────────────────
function buildVariantSelector(variants, handle) {
  const hasLabels = variants[0].title !== null;

  // Single variant — show as static weight pill (no click needed)
  if (variants.length === 1) {
    if (!hasLabels) return '';
    return `
      <div class="variant-selector" data-handle="${handle}">
        <span class="variant-btn active" style="cursor:default;">
          ${variants[0].title}
        </span>
      </div>`;
  }

  // Multiple variants — show clickable buttons
  if (!hasLabels) return '';

  return `
    <div class="variant-selector" data-handle="${handle}">
      ${variants.map((v, i) => `
        <button
          class="variant-btn ${i === 0 ? 'active' : ''} ${!v.available ? 'sold-out' : ''}"
          data-variant-id="${v.id}"
          data-price="${v.price}"
          data-compare="${v.compareAt || ''}"
          data-discount="${v.discount || ''}"
          data-available="${v.available}"
          ${!v.available ? 'disabled' : ''}
          title="${!v.available ? 'Out of Stock' : v.title}">
          ${v.title}
          ${!v.available ? ' ✕' : ''}
        </button>
      `).join('')}
    </div>`;
}

// ─── UPDATE PRICE DISPLAY ─────────────────────────────────────
function updatePriceDisplay(card, price, compareAt, discount) {
  const priceEl = card.querySelector('.price-current');
  const pw = card.querySelector('.price-wrapper');

  if (priceEl) {
    priceEl.textContent = `₹${parseFloat(price).toFixed(0)}`;
  }

  if (pw) {
    pw.querySelectorAll('.price-original, .price-discount').forEach(el => el.remove());
    if (compareAt && discount) {
      pw.insertAdjacentHTML('beforeend', `
        <span class="price-original">₹${parseFloat(compareAt).toFixed(0)}</span>
        <span class="price-discount">${discount}% OFF</span>
      `);
    }
  }
}

// ─── SYNC ALL PRODUCT CARDS ───────────────────────────────────
async function syncProductCards() {
  const shopifyData = await fetchShopifyProducts();
  if (!shopifyData) return;

  document.querySelectorAll('.product-card[data-product]').forEach(card => {
    const key = card.getAttribute('data-product');
    const handle = PRODUCT_MAP[key];
    if (!handle || !shopifyData[handle]) return;

    const data = shopifyData[handle];
    const firstAvailable = data.variants.find(v => v.available) || data.variants[0];

    // ── UPDATE IMAGES ─────────────────────────────────────────
    if (data.images.length > 0) {
      card.querySelectorAll('.product-img').forEach((img, i) => {
        img.src = data.images[i] || data.images[0];
      });
    }

    // ── REMOVE HARDCODED WEIGHT ───────────────────────────────
    card.querySelector('.product-meta')?.remove();

    // ── UPDATE PRICE — always first available variant, no "From" ──
    updatePriceDisplay(
      card,
      firstAvailable.price,
      firstAvailable.compareAt,
      firstAvailable.discount
    );

    // ── INJECT VARIANT SELECTOR ───────────────────────────────
    if (!card.querySelector('.variant-selector')) {
      const priceWrapper = card.querySelector('.price-wrapper');
      if (priceWrapper) {
        const selectorHTML = buildVariantSelector(data.variants, handle);
        if (selectorHTML) {
          priceWrapper.insertAdjacentHTML('afterend', selectorHTML);

          // Attach click events only for multi-variant products
          if (data.hasMultipleVariants) {
            card.querySelectorAll('.variant-btn').forEach(btn => {
              btn.addEventListener('click', () => {
                if (btn.dataset.available === 'false') return;

                // Update active state
                card.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update price to selected variant
                updatePriceDisplay(
                  card,
                  btn.dataset.price,
                  btn.dataset.compare || null,
                  btn.dataset.discount || null
                );

                // Update Buy Now to selected variant
                const variantId = btn.dataset.variantId.split('/').pop();
                const buyBtn = card.querySelector('.btn-primary');
                if (buyBtn) {
                  buyBtn.href = `https://${SHOPIFY_DOMAIN}/products/${handle}?variant=${variantId}`;
                }
              });
            });
          }
        }
      }
    }

    // ── SET BUY NOW LINK ──────────────────────────────────────
    const buyBtn = card.querySelector('.btn-primary');
    if (buyBtn) {
      if (!data.anyAvailable) {
        buyBtn.innerHTML = `<span>Out of Stock</span>`;
        buyBtn.style.opacity = '0.5';
        buyBtn.style.pointerEvents = 'none';
        buyBtn.removeAttribute('href');
      } else {
        const variantId = firstAvailable.id.split('/').pop();
        buyBtn.href = `https://${SHOPIFY_DOMAIN}/products/${handle}?variant=${variantId}`;
        buyBtn.target = '_blank';
        buyBtn.rel = 'noopener';
      }
    }

    // ── OUT OF STOCK BADGE ────────────────────────────────────
    if (!data.anyAvailable) {
      const wrapper = card.querySelector('.product-image-wrapper');
      const badge = wrapper?.querySelector('.product-badge');
      if (badge) {
        badge.textContent = 'Out of Stock';
        badge.className = 'product-badge out';
      } else {
        wrapper?.insertAdjacentHTML('afterbegin',
          `<div class="product-badge out">Out of Stock</div>`);
      }
    }

    // ── LOW STOCK WARNING ─────────────────────────────────────
    if (data.anyAvailable && firstAvailable.quantity > 0 && firstAvailable.quantity <= 5) {
      const footer = card.querySelector('.product-footer');
      if (footer && !footer.querySelector('.low-stock')) {
        footer.insertAdjacentHTML('beforeend',
          `<p class="low-stock">⚠️ Only ${firstAvailable.quantity} left!</p>`);
      }
    }
  });
}

// ─── SHOPIFY URL MAPPING ──────────────────────────────────────
const SHOP_URLS = {
  login:    `https://${SHOPIFY_DOMAIN}/account/login`,
  register: `https://${SHOPIFY_DOMAIN}/account/register`,
  account:  `https://${SHOPIFY_DOMAIN}/account`,
  orders:   `https://${SHOPIFY_DOMAIN}/account/orders`,
  cart:     `https://${SHOPIFY_DOMAIN}/cart`,
  shop:     `https://${SHOPIFY_DOMAIN}`,
};

function mapShopifyLinks() {
  document.querySelectorAll('[data-shopify]').forEach(el => {
    const key = el.getAttribute('data-shopify');
    if (SHOP_URLS[key]) {
      el.href = SHOP_URLS[key];
      el.target = '_blank';
      el.rel = 'noopener';
    }
  });
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  mapShopifyLinks();
  syncProductCards();
});
