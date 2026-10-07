/**
 * MantraAQ product card renderer.
 * Shared by the browser (js/storefront.js) and the static build
 * (scripts/generate-products.js) so pre-rendered and live cards match.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MantraAQCard = api;
})(typeof self !== 'undefined' ? self : this, function () {

  // Background tint behind each product photo (see --tint-* in css/site.css)
  const TINTS = {
    'singhara-atta': 'var(--tint-atta)',
    'singhara-pasta': 'var(--tint-pasta)',
    'singhara-pasta-macaroni': 'var(--tint-pasta)',
    'singhara-vermicell': 'var(--tint-vermicelli)',
    'dry-singhara': 'var(--tint-dry)',
    'fresh-singhara': 'var(--tint-fresh)',
    'singhara-snacks': 'var(--tint-snacks)',
    'glowaq-wellness-drink': 'var(--tint-glow)'
  };
  const FALLBACK_TINTS = ['var(--tint-atta)', 'var(--tint-fresh)', 'var(--tint-vermicelli)', 'var(--tint-pasta)'];

  const BADGES = {
    'bestseller': { cls: 'bestseller', label: 'Bestseller' },
    'new-launch': { cls: 'new', label: 'New' },
    'seasonal': { cls: 'seasonal', label: 'Seasonal' },
    'coming-soon': { cls: 'coming-soon', label: 'Coming soon' }
  };

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function tagKey(t) { return String(t).toLowerCase().trim().replace(/\s+/g, '-'); }

  function tintFor(product, index) {
    return TINTS[product.handle] || FALLBACK_TINTS[(index || 0) % FALLBACK_TINTS.length];
  }

  function categorySlug(category) {
    return String(category || 'other').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function isComingSoon(product) {
    return (product.tags || []).map(tagKey).includes('coming-soon');
  }

  function isInStock(product) {
    return (product.variants || []).some(v => v.stockQuantity > 0);
  }

  /** First line or sentence of the admin description, used as the card tagline. */
  function tagline(description) {
    if (!description) return '';
    const firstPara = String(description).split(/\n\s*\n|\n/)[0].trim();
    if (firstPara.length <= 120) return firstPara;
    const sentence = firstPara.match(/^.*?[.!?](\s|$)/);
    return sentence ? sentence[0].trim() : firstPara.slice(0, 117) + '…';
  }

  function badgeFor(product) {
    for (const t of product.tags || []) {
      const b = BADGES[tagKey(t)];
      if (b) return b;
    }
    return null;
  }

  function featureTags(product) {
    return (product.tags || []).filter(t => !BADGES[tagKey(t)]);
  }

  function defaultVariant(product) {
    return product.variants.find(v => v.stockQuantity > 0) || product.variants[0];
  }

  function discountPct(price, compareAt) {
    if (!compareAt || Number(compareAt) <= Number(price)) return 0;
    return Math.round(((compareAt - price) / compareAt) * 100);
  }

  function rupees(n) { return '₹' + Math.round(Number(n)).toLocaleString('en-IN'); }

  const STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
  const BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 016 0"/></svg>';
  const CHEV_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>';
  const CHEV_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';

  function ratingHtml(product) {
    if (!product.reviewCount || !product.avgRating) return '';
    return `<span class="pc-rating" title="${escapeHtml(product.avgRating)} out of 5">${STAR}${escapeHtml(Number(product.avgRating).toFixed(1))} <span>(${escapeHtml(product.reviewCount)})</span></span>`;
  }

  function priceHtml(variant) {
    const off = discountPct(variant.price, variant.compareAtPrice);
    return `<span class="price-current">${rupees(variant.price)}</span>` +
      (off ? `<span class="price-original">${rupees(variant.compareAtPrice)}</span><span class="price-discount">${off}% OFF</span>` : '');
  }

  function variantPills(product, selectedId) {
    const vs = product.variants || [];
    if (!vs.length) return '';
    return `<div class="variant-selector" data-handle="${escapeHtml(product.handle)}" role="group" aria-label="Choose size">` +
      vs.map(v => {
        const out = v.stockQuantity === 0;
        const active = v.id === selectedId;
        return `<button type="button" class="variant-btn${active ? ' active' : ''}${out ? ' is-out' : ''}" data-variant-id="${escapeHtml(v.id)}" data-price="${escapeHtml(v.price)}" data-compare="${escapeHtml(v.compareAtPrice || '')}" data-stock="${escapeHtml(v.stockQuantity)}" aria-pressed="${active}"${out ? ' disabled title="Out of stock"' : ''}>${escapeHtml(v.title)}</button>`;
      }).join('') + '</div>';
  }

  /**
   * Render one product card.
   * opts.resolveImage(url) -> absolute/relative URL; opts.index for tint fallback;
   * opts.eager to skip lazy-loading the first image.
   */
  function render(product, opts) {
    opts = opts || {};
    const resolve = opts.resolveImage || (u => u);
    const images = (product.images && product.images.length ? product.images : (opts.fallbackImages || [])).map(resolve);
    const dv = defaultVariant(product);
    const badge = badgeFor(product);
    const soon = isComingSoon(product);
    const url = `/products/${encodeURIComponent(product.handle)}`;
    const name = escapeHtml(product.name);

    const gallery = images.map((src, i) =>
      `<img src="${escapeHtml(src)}" alt="${name}${i ? ' - image ' + (i + 1) : ''}" class="product-img${i === 0 ? ' active' : ''}" data-index="${i}" width="600" height="600" ${opts.eager && i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`
    ).join('');

    const nav = images.length > 1 ? `
          <button type="button" class="gallery-nav prev" aria-label="Previous image">${CHEV_L}</button>
          <button type="button" class="gallery-nav next" aria-label="Next image">${CHEV_R}</button>
          <div class="gallery-indicators">${images.map((_, i) => `<span class="indicator${i === 0 ? ' active' : ''}" data-index="${i}"></span>`).join('')}</div>` : '';

    const cta = soon
      ? `<a href="#newsletter" class="btn-primary coming-soon-disabled">Notify me</a>`
      : (!isInStock(product)
        ? `<a href="${url}" class="btn-primary coming-soon-disabled">Sold out</a>`
        // Static fallback is a link to the product page; storefront.js turns it into Add to cart once live data loads.
        : `<a href="${url}" class="btn-primary pc-add" data-add>${BAG}<span>Add</span></a>`);

    return `
      <article class="product-card" data-product="${escapeHtml(product.handle)}" data-category="${escapeHtml(categorySlug(product.category))}" data-soon="${soon}" style="--tint:${tintFor(product, opts.index)}">
        <div class="product-image-wrapper">
          ${badge ? `<span class="product-badge ${badge.cls}">${badge.label}</span>` : ''}
          <div class="product-gallery"><a href="${url}" tabindex="-1" aria-hidden="true">${gallery}</a></div>${nav}
        </div>
        <div class="product-content">
          <div class="pc-meta"><span class="pc-cat">${escapeHtml(product.category || 'Singhara')}</span>${ratingHtml(product)}</div>
          <h3 class="product-title"><a href="${url}">${name}</a></h3>
          <p class="product-description">${escapeHtml(tagline(product.description))}</p>
          <div class="product-features">${featureTags(product).slice(0, 4).map(t => `<span class="feature-tag">${escapeHtml(t)}</span>`).join('')}</div>
          <div class="variant-selector-container">${variantPills(product, dv.id)}</div>
          <div class="product-footer">
            <div class="price-wrapper">${priceHtml(dv)}</div>
            ${cta}
          </div>
        </div>
      </article>`;
  }

  /** Coming-soon products go last; otherwise keep the admin sort order. */
  function sortForShelf(products) {
    return products.slice().sort((a, b) => Number(isComingSoon(a)) - Number(isComingSoon(b)));
  }

  return {
    render, sortForShelf, tintFor, categorySlug, isComingSoon, isInStock, tagline, badgeFor, featureTags,
    defaultVariant, discountPct, rupees, priceHtml, escapeHtml, STAR, BAG
  };
});
