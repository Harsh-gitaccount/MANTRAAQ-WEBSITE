/**
 * Mantraaq Storefront Product Syncing Script
 * Renders product cards from the admin/backend database into:
 *   - #storefront-products-grid (the main shop grid, with category filters)
 *   - any [data-product-rail] container (carousels such as "Complete your pantry")
 * Card markup comes from js/product-card.js, shared with the static build.
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
  'singhara-pasta-macaroni': ['/assets/images/web/pasta-800.webp'],
  'singhara-pasta':          ['/assets/images/web/pasta-800.webp'],
  'singhara-vermicell':      ['/assets/images/web/vermicelli-800.webp'],
  'singhara-atta':           ['/assets/images/web/atta-800.webp'],
  'fresh-singhara':          ['/assets/images/web/fresh-singhara-800.webp'],
  'dry-singhara':            ['/assets/images/web/dry-singhara-800.webp'],
  'singhara-snacks':         ['/assets/images/web/snacks-800.webp']
};

// Store loaded products globally for variant lookups
let loadedProductsMap = {};

// Expose globally so other modules (wishlist, search) can access it
window._loadedProductsMap = loadedProductsMap;
window._PRODUCT_MAP = PRODUCT_MAP;

const Card = window.MantraAQCard;

function productForCard(card) {
  const key = card.getAttribute('data-product');
  return loadedProductsMap[PRODUCT_MAP[key] || key] || null;
}

/**
 * Update pricing display inside a card
 */
function updatePriceDisplay(card, price, compareAt) {
  const pw = card.querySelector('.price-wrapper');
  if (!pw) return;
  pw.innerHTML = Card.priceHtml({ price: parseFloat(price), compareAtPrice: compareAt ? parseFloat(compareAt) : null });
}

/**
 * Card image gallery: arrows and dots switch images; on desktop, hovering
 * shows the second photo. No autoplay, so the grid stays calm.
 */
function initCardGallery(card) {
  if (card.dataset.galleryBound) return;
  card.dataset.galleryBound = '1';

  const images = card.querySelectorAll('.product-img');
  const indicators = card.querySelectorAll('.indicator');
  if (images.length <= 1) return;

  let current = 0;
  function goTo(index) {
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    images.forEach((img, i) => img.classList.toggle('active', i === index));
    indicators.forEach((ind, i) => ind.classList.toggle('active', i === index));
    current = index;
  }

  const prev = card.querySelector('.gallery-nav.prev');
  const next = card.querySelector('.gallery-nav.next');
  prev && prev.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); goTo(current - 1); });
  next && next.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); goTo(current + 1); });
  indicators.forEach((ind, i) => ind.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); goTo(i); }));

  if (window.matchMedia('(hover: hover)').matches) {
    const media = card.querySelector('.product-image-wrapper');
    media.addEventListener('mouseenter', () => goTo(1));
    media.addEventListener('mouseleave', () => goTo(0));
  }
}

/**
 * Variant pills and the Add button. Works before live data arrives (prices come
 * from data attributes; the Add button is still a link to the product page),
 * and becomes a real add-to-cart once the product is in loadedProductsMap.
 */
/**
 * Cards show at most four size pills. With more, the first three (and the selected one)
 * stay (sold-out sizes fold first) and a "+2" pill reveals the rest, so any number of sizes fits.
 */
const MAX_PILLS = 4;
function foldPills(card) {
  const box = card.querySelector('.variant-selector');
  if (!box || box.dataset.folded) return;
  const pills = Array.from(box.querySelectorAll('.variant-btn'));
  if (pills.length <= MAX_PILLS) return;
  box.dataset.folded = '1';
  // Keep the selected size, then sizes in stock, then sold-out ones; shown in their usual order
  const out = b => b.disabled || b.classList.contains('is-out') || b.dataset.stock === '0';
  const rank = b => (b.classList.contains('active') ? 0 : out(b) ? 2 : 1);
  const keep = pills.slice().sort((x, y) => rank(x) - rank(y)).slice(0, MAX_PILLS - 1);
  const hidden = pills.filter(b => !keep.includes(b));
  hidden.forEach(b => b.classList.add('is-folded'));
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'variant-btn variant-more';
  more.textContent = '+' + hidden.length;
  more.setAttribute('aria-label', `Show ${hidden.length} more sizes`);
  more.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    hidden.forEach(b => b.classList.remove('is-folded'));
    more.remove();
  });
  box.appendChild(more);
}

function bindCard(card) {
  initCardGallery(card);

  const product = productForCard(card);
  let selectedVariantId = (card.querySelector('.variant-btn.active') || {}).dataset?.variantId;

  if (!card.dataset.pillsBound) {
    card.dataset.pillsBound = '1';
    card.querySelectorAll('.variant-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (btn.disabled || btn.dataset.stock === '0') return;
        card.querySelectorAll('.variant-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        card.dataset.selectedVariant = btn.dataset.variantId;
        updatePriceDisplay(card, btn.dataset.price, btn.dataset.compare);
      });
    });
  }
  foldPills(card);

  if (!product || card.dataset.cartBound) return;
  const addBtn = card.querySelector('[data-add]');
  if (!addBtn) return;
  card.dataset.cartBound = '1';

  addBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const liveProduct = productForCard(card) || product;
    const variantId = card.dataset.selectedVariant || selectedVariantId;
    const variant = liveProduct.variants.find(v => v.id === variantId) || Card.defaultVariant(liveProduct);
    if (!variant) return;
    if (variant.stockQuantity !== undefined && variant.stockQuantity <= 0) {
      window.Toast.error(`Out of Stock: "${liveProduct.name} (${variant.title})" is sold out.`);
      return;
    }
    window.Cart.addItem(variant, liveProduct, 1);
    addBtn.classList.add('is-added');
    setTimeout(() => addBtn.classList.remove('is-added'), 900);
  });
}

function renderCards(products, opts) {
  return products.map((p, i) => Card.render(p, {
    index: i,
    eager: opts && opts.eager && i < 2,
    fallbackImages: LOCAL_IMAGE_FALLBACK[p.handle] || [],
    resolveImage: url => MantraAQSanitizeURL(window.MantraaqAPI.resolveImageUrl(url))
  })).join('');
}

/**
 * Category filter chips above the main grid, built from the cards already in it,
 * so filtering works on the pre-rendered page even before (or without) the API.
 */
function buildFilters() {
  const bar = document.getElementById('shop-filters');
  const grid = document.getElementById('storefront-products-grid');
  if (!bar || !grid) return;

  const cards = Array.from(grid.querySelectorAll('.product-card'));
  const seen = new Map();
  cards.forEach(card => {
    if (card.dataset.soon === 'true' || !card.dataset.category) return;
    const label = (card.querySelector('.pc-cat') || {}).textContent || card.dataset.category;
    if (!seen.has(card.dataset.category)) seen.set(card.dataset.category, label.trim());
  });
  if (seen.size < 2) { bar.hidden = true; return; }
  bar.hidden = false;

  const chips = [['all', 'All'], ...seen.entries()];
  if (cards.some(c => c.dataset.soon === 'true')) chips.push(['soon', 'Coming soon']);

  bar.innerHTML = chips.map(([slug, label], i) =>
    `<button type="button" class="filter${i === 0 ? ' is-active' : ''}" data-filter="${Card.escapeHtml(slug)}" aria-pressed="${i === 0}">${Card.escapeHtml(label)}</button>`
  ).join('');

  bar.querySelectorAll('.filter').forEach(chip => {
    chip.addEventListener('click', () => applyFilter(chip.dataset.filter));
  });

  applyFilter(currentFilter || new URLSearchParams(window.location.search).get('category') || 'all');
}

let currentFilter = null;

function applyFilter(slug) {
  currentFilter = slug;
  const bar = document.getElementById('shop-filters');
  const grid = document.getElementById('storefront-products-grid');
  if (!grid) return;
  // Accepts one slug or several separated by commas (e.g. a tile covering two categories)
  let slugs = String(slug || 'all').split(',').map(s => s.trim()).filter(Boolean);
  let any = false;
  grid.querySelectorAll('.product-card').forEach(card => {
    const show = slugs.includes('all')
      || (slugs.includes('soon') && card.dataset.soon === 'true')
      || (slugs.includes(card.dataset.category) && card.dataset.soon !== 'true');
    card.classList.toggle('is-hidden', !show);
    any = any || show;
  });
  if (!any) {
    slugs = ['all'];
    grid.querySelectorAll('.product-card').forEach(c => c.classList.remove('is-hidden'));
  }
  bar && bar.querySelectorAll('.filter').forEach(c => {
    const on = slugs.includes(c.dataset.filter);
    c.classList.toggle('is-active', on);
    c.setAttribute('aria-pressed', String(on));
  });
  // Mark the matching category tile and name the grid after it
  let label = 'All products';
  document.querySelectorAll('[data-shop-filter]').forEach(tile => {
    const on = slugs.join(',') === tile.dataset.shopFilter;
    tile.classList.toggle('is-active', on);
    if (on) label = (tile.querySelector('h3') || {}).textContent || label;
  });
  const title = document.getElementById('shop-all-title');
  if (title) title.textContent = label;
  showCount(grid, slugs);
}

/** "2 of 7 products, Show all" under the filters, so a filtered grid never looks like the whole range */
function showCount(grid, slugs) {
  const bar = document.getElementById('shop-filters');
  if (!bar || bar.hidden) return;
  let line = document.getElementById('shop-count');
  if (!line) {
    line = document.createElement('p');
    line.id = 'shop-count';
    line.className = 'shop-count';
    line.setAttribute('aria-live', 'polite');
    bar.after(line);
    line.addEventListener('click', e => { if (e.target.closest('button')) applyFilter('all'); });
  }
  const cards = grid.querySelectorAll('.product-card');
  const shown = grid.querySelectorAll('.product-card:not(.is-hidden)').length;
  const word = n => n === 1 ? 'product' : 'products';
  line.innerHTML = slugs.includes('all')
    ? `<b>${cards.length}</b> ${word(cards.length)}`
    : `Showing <b>${shown}</b> of ${cards.length} ${word(cards.length)}<button type="button">Show all</button>`;
}
window.MantraAQShopFilter = applyFilter;

/** Product rails: <div data-product-rail data-exclude="handle" data-limit="8"> */
function renderRails(products) {
  document.querySelectorAll('[data-product-rail]').forEach(rail => {
    const exclude = (rail.dataset.exclude || '').split(',').filter(Boolean);
    const limit = parseInt(rail.dataset.limit || '8', 10);
    const list = products.filter(p => !exclude.includes(p.handle) && !Card.isComingSoon(p) && Card.isInStock(p)).slice(0, limit);
    if (!list.length) {
      const section = rail.closest('[data-rail-section]');
      if (section) section.hidden = true;
      return;
    }
    rail.innerHTML = renderCards(list);
    rail.dispatchEvent(new CustomEvent('rail:updated', { bubbles: true }));
  });
}

/**
 * Fetch products and dynamically build the products grid
 */
async function syncProductCards() {
  const gridContainer = document.getElementById('storefront-products-grid');
  const hasRails = document.querySelector('[data-product-rail]');

  // Bind pre-rendered cards right away so pills and galleries work before the API answers
  document.querySelectorAll('.product-card').forEach(bindCard);
  buildFilters();

  let products;
  try {
    products = await window.MantraaqAPI.fetchProducts({ limit: 100 });
  } catch (e) {
    console.warn('Storefront: Could not fetch products, preserving pre-rendered cards', e);
    if (gridContainer && !gridContainer.querySelector('.product-card')) {
      gridContainer.innerHTML = `<div class="grid-empty">We couldn't load products right now. Please refresh in a moment.</div>`;
    }
    return;
  }

  if (!products || products.length === 0) {
    if (gridContainer && !gridContainer.querySelector('.product-card')) {
      gridContainer.innerHTML = `<div class="grid-empty">No products found.</div>`;
    }
    return;
  }

  // Filter for active products
  const activeProducts = Card.sortForShelf(products.filter(p => p.isActive !== false && p.variants && p.variants.length > 0));

  // Index active products globally
  loadedProductsMap = {};
  activeProducts.forEach(p => { loadedProductsMap[p.handle] = p; });
  window._loadedProductsMap = loadedProductsMap;

  // Sync cart items with fetched product stock levels
  if (window.Cart && typeof window.Cart.syncStock === 'function') {
    window.Cart.syncStock(products);
  }

  if (gridContainer) {
    gridContainer.innerHTML = renderCards(activeProducts, { eager: true });
    buildFilters();
  }
  if (hasRails) renderRails(activeProducts);

  document.querySelectorAll('.product-card').forEach(bindCard);

  // Inject Product Schema Markup dynamically for Search Engine Crawlers
  if (gridContainer) {
    try {
      const existingSchema = document.getElementById('dynamic-product-schema');
      if (existingSchema) existingSchema.remove();

      const schemas = activeProducts.map(product => {
        const defaultVariant = product.variants[0];
        const galleryImages = product.images && product.images.length > 0 ? product.images : (LOCAL_IMAGE_FALLBACK[product.handle] || []);
        const inStock = Card.isInStock(product);
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "description": product.description || `Premium quality ${product.name} from MantraAQ.`,
          "image": galleryImages.map(imgUrl => window.MantraaqAPI.resolveImageUrl(imgUrl)),
          "sku": defaultVariant.sku || product.handle,
          "offers": {
            "@type": "Offer",
            "url": `https://mantraaq.com/products/${product.handle}`,
            "priceCurrency": "INR",
            "price": defaultVariant.price,
            "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "priceValidUntil": "2030-12-31"
          }
        };
      });

      const script = document.createElement('script');
      script.id = 'dynamic-product-schema';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schemas);
      document.head.appendChild(script);
    } catch (schemaErr) {
      console.warn('Failed to inject product schemas:', schemaErr);
    }
  }

  // Dispatch global event for other modules (wishlist, search, site motion) to notice load
  window.dispatchEvent(new CustomEvent('storefront:synced', { detail: { products: activeProducts } }));

  // Trigger wishlist sync directly as well
  if (window.Wishlist && typeof window.Wishlist.syncProductHearts === 'function') {
    window.Wishlist.syncProductHearts();
  }
}

// Initialize storefront updates
document.addEventListener('DOMContentLoaded', () => {
  syncProductCards();
});
