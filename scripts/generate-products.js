/**
 * MantraAQ static page generator
 *
 * Fetches all active products from the backend API at build time and writes:
 *   - products/<handle>.html   one crawlable product page per product
 *   - index.html               pre-rendered product cards, bestseller rail and ItemList schema
 *   - sitemap.xml, llms.txt    for search engines and AI assistants
 *   - scripts/catalog-snapshot.json, the fallback used when the API is unreachable
 *
 * Run: node scripts/generate-products.js
 *      node scripts/generate-products.js --snapshot   (offline: build from the snapshot file)
 *      MANTRAAQ_API_URL=http://localhost:5000/api node scripts/generate-products.js
 */

const fs = require('fs');
const path = require('path');
const Card = require('../js/product-card.js');
const partials = require('./partials');
const { factsFor } = require('./product-facts');

const SITE_URL = 'https://mantraaq.com';
const API_URL = process.env.MANTRAAQ_API_URL || 'https://mantraaq-backend.onrender.com/api';
const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'products');
const SNAPSHOT_PATH = path.join(__dirname, 'catalog-snapshot.json');
const SNAPSHOT_FIELDS = ['handle', 'name', 'category', 'description', 'tags', 'images', 'sortOrder', 'isActive'];
const VARIANT_FIELDS = ['id', 'title', 'price', 'compareAtPrice', 'sku', 'stockQuantity'];

// Local photos used when a product has no images in the database
const LOCAL_IMAGE_FALLBACK = {
  'singhara-pasta-macaroni': ['/assets/images/web/pasta-800.webp'],
  'singhara-pasta':          ['/assets/images/web/pasta-800.webp'],
  'singhara-vermicell':      ['/assets/images/web/vermicelli-800.webp'],
  'singhara-atta':           ['/assets/images/web/atta-800.webp'],
  'fresh-singhara':          ['/assets/images/web/fresh-singhara-800.webp'],
  'dry-singhara':            ['/assets/images/web/dry-singhara-800.webp'],
  'singhara-snacks':         ['/assets/images/web/snacks-800.webp'],
};

const esc = Card.escapeHtml;

/** URL as used inside the page (root-relative for local files). */
function pageImageUrl(url) {
  if (!url) return '/assets/images/web/atta-800.webp';
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith('uploads/')) return `https://mantraaq-backend.onrender.com/${url}`;
  return url.startsWith('/') ? url : `/${url}`;
}

/** Absolute URL for schema and social tags. */
function absoluteImageUrl(url) {
  const u = pageImageUrl(url);
  return u.startsWith('/') ? `${SITE_URL}${u}` : u;
}

function productImages(product) {
  const imgs = product.images && product.images.length ? product.images : (LOCAL_IMAGE_FALLBACK[product.handle] || []);
  return imgs.map(pageImageUrl);
}

function metaDescription(product) {
  const facts = factsFor(product.handle);
  const lead = Card.tagline(product.description);
  const body = String(product.description || '').replace(/\s+/g, ' ').trim();
  let text = body || `${product.name} from MantraAQ, singhara foods from the wetlands of Bihar.`;
  if (facts && facts.claims) text = `${lead} ${facts.claims.slice(0, 3).join(', ')}. ${body.slice(lead.length).trim()}`.trim();
  return text.length <= 158 ? text : text.slice(0, 155).replace(/\s+\S*$/, '') + '…';
}

function paragraphs(text) {
  return String(text || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
}

// ── Structured data ────────────────────────────────────────────────

function buildProductSchema(product, productUrl) {
  const facts = factsFor(product.handle);
  const images = productImages(product).map(absoluteImageUrl);
  if (facts && facts.pack) images.push(`${SITE_URL}${facts.pack}-1000.webp`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: paragraphs(product.description).join(' ') || `${product.name} from MantraAQ.`,
    image: images,
    sku: (product.variants[0] && product.variants[0].sku) || product.handle,
    brand: { '@type': 'Brand', name: 'MantraAQ' },
    url: productUrl,
    category: product.category || 'Food',
    countryOfOrigin: { '@type': 'Country', name: 'India' },
    offers: product.variants.map(v => ({
      '@type': 'Offer',
      name: `${product.name} ${v.title}`,
      sku: v.sku || `${product.handle}-${v.title}`.toLowerCase().replace(/\s+/g, '-'),
      price: Number(v.price),
      priceCurrency: 'INR',
      priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
      itemCondition: 'https://schema.org/NewCondition',
      availability: Card.isComingSoon(product) ? 'https://schema.org/PreOrder'
        : (v.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'),
      url: productUrl,
      seller: { '@type': 'Organization', name: 'MantraAQ Industries Private Limited' }
    }))
  };
  if (facts) {
    const props = [];
    if (facts.ingredients) props.push({ '@type': 'PropertyValue', name: 'Ingredients', value: facts.ingredients.join(', ') });
    if (facts.claims) props.push(...facts.claims.map(c => ({ '@type': 'PropertyValue', name: 'Dietary claim', value: c })));
    if (facts.nutrition) {
      const col = facts.nutrition.columns[0];
      props.push(...facts.nutrition.rows.map(r => ({ '@type': 'PropertyValue', name: `${r[0]} (${col.toLowerCase()})`, value: r[1] })));
    }
    if (props.length) schema.additionalProperty = props;
    if (facts.maker) schema.manufacturer = { '@type': 'Organization', name: facts.maker.name, address: facts.maker.address };
  }
  if (product.avgRating && product.reviewCount) {
    schema.aggregateRating = { '@type': 'AggregateRating', ratingValue: product.avgRating, reviewCount: product.reviewCount };
  }
  return schema;
}

function buildBreadcrumbSchema(product, productUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/#products` },
      { '@type': 'ListItem', position: 3, name: product.name, item: productUrl }
    ]
  };
}

/** Questions shown on the page and in FAQPage schema. */
function productFaqs(product) {
  const facts = factsFor(product.handle);
  const faqs = facts && facts.faqs ? facts.faqs.slice() : [];
  faqs.push(
    ['How long does delivery take?', 'Orders are packed and dispatched within 1 to 2 business days. Delivery takes 3 to 7 business days to metro cities and 4 to 10 business days to most other cities. Shipping is free on orders above ₹499.'],
    ['What if my order arrives damaged?', 'Write to us within 48 hours of delivery with your order ID and photos, and we will replace or refund damaged, wrong or spoiled products.']
  );
  return faqs;
}

function buildFaqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
  };
}

function ldJson(obj) {
  // Escape "<" so text from the admin can't close the script tag
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2).replace(/</g, '\\u003c')}\n    </script>`;
}

// ── Product page ───────────────────────────────────────────────────

const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
const TRUCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M1 4h14v12H1zM15 9h4l3 3v4h-7"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></svg>';

function railSection({ id, eyebrow, title, exclude, cards }) {
  return `<section class="section" aria-labelledby="${id}" data-rail-section${cards ? '' : ' hidden'}>
  <div class="wrap" data-rail>
    <div class="section-head">
      <div data-reveal>
        <span class="eyebrow">${eyebrow}</span>
        <h2 id="${id}" class="display-l">${title}</h2>
      </div>
      <div class="rail-controls" data-reveal style="--d:.1s">
        <button class="rail-btn" type="button" data-rail-prev aria-label="Previous products"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>
        <button class="rail-btn" type="button" data-rail-next aria-label="Next products"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      </div>
    </div>
    <div class="rail" data-product-rail data-limit="8"${exclude ? ` data-exclude="${esc(exclude)}"` : ''} aria-live="polite">
${cards}
    </div>
    <div class="rail-progress" aria-hidden="true"><i></i></div>
  </div>
</section>`;
}

/** Cards for a rail: in stock, not coming soon, minus the excluded handle. */
function railCards(products, exclude) {
  return products
    .filter(p => p.handle !== exclude && !Card.isComingSoon(p) && Card.isInStock(p))
    .slice(0, 8)
    .map((p, i) => Card.render(p, { index: i, resolveImage: pageImageUrl, fallbackImages: LOCAL_IMAGE_FALLBACK[p.handle] }))
    .join('\n');
}

function nutritionTable(n) {
  return `<table class="nutri">
              <thead><tr><th scope="col">Nutrient</th>${n.columns.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
              <tbody>${n.rows.map(r => `<tr${/^of which/.test(r[0]) ? ' class="sub"' : ''}><th scope="row">${esc(r[0])}</th>${r.slice(1).map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>${n.note ? `\n            <p class="nutri-note">${esc(n.note)}</p>` : ''}`;
}

function packSection(product, facts) {
  if (!facts || !facts.pack) return '';
  return `<section class="section pack" aria-labelledby="pack-h">
  <div class="wrap pack-grid">
    <div class="pack-visual" data-reveal>
      <img src="${facts.pack}-1000.webp" srcset="${facts.pack}-600.webp 600w, ${facts.pack}-1000.webp 1000w" sizes="(max-width: 900px) 80vw, 440px" alt="${esc(facts.packName)} pack front" width="1000" height="1000" loading="lazy" decoding="async">
      <span class="pack-net">${esc(facts.netWeight)}</span>
    </div>
    <div class="pack-facts" data-reveal style="--d:.1s">
      <span class="eyebrow">On the pack</span>
      <h2 id="pack-h" class="display-l">What's inside, <em class="serif-italic">nothing hidden.</em></h2>
      <ul class="pack-claims">${(facts.claims || []).map(c => `<li>${CHECK}${esc(c)}</li>`).join('')}</ul>
      <h3 class="pack-sub">Ingredients</h3>
      <p class="pack-ingredients">${facts.ingredients.map(esc).join(' · ')}</p>
      ${facts.ingredientsNote ? `<p class="pack-note">${esc(facts.ingredientsNote)}</p>` : ''}
      ${facts.nutrition ? `<h3 class="pack-sub">Nutrition information</h3>\n            ${nutritionTable(facts.nutrition)}` : ''}
    </div>
  </div>
</section>`;
}

function generateProductHTML(product, allProducts) {
  const productUrl = `${SITE_URL}/products/${product.handle}`;
  const facts = factsFor(product.handle);
  const images = productImages(product);
  const ogImage = facts && facts.pack ? `${SITE_URL}${facts.pack}-1000.webp` : absoluteImageUrl(images[0]);
  const dv = Card.defaultVariant(product);
  const inStock = Card.isInStock(product);
  const soon = Card.isComingSoon(product);
  const lowestPrice = Math.min(...product.variants.map(v => Number(v.price)));
  const tint = Card.tintFor(product, 0);
  const name = esc(product.name);
  const desc = metaDescription(product);
  const faqs = productFaqs(product);
  const off = Card.discountPct(dv.price, dv.compareAtPrice);
  const highlights = (facts && facts.claims) || Card.featureTags(product).slice(0, 4);
  const badge = Card.badgeFor(product);

  const gallery = images.map((src, i) =>
    `<figure><img src="${esc(src)}" alt="${name}${i ? ` - image ${i + 1}` : ''}" width="900" height="900" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></figure>`
  ).join('\n          ');
  const thumbs = images.length > 1 ? images.map((src, i) =>
    `<button type="button" class="pdp-thumb${i === 0 ? ' is-active' : ''}" data-index="${i}" aria-label="Show image ${i + 1}"><img src="${esc(src)}" alt="" width="76" height="76" loading="lazy"></button>`
  ).join('\n          ') : '';

  const sizes = product.variants.map(v => {
    const out = !(v.stockQuantity > 0);
    const vOff = Card.discountPct(v.price, v.compareAtPrice);
    return `<button type="button" class="pdp-size${v.id === dv.id ? ' is-active' : ''}${out ? ' is-out' : ''}" data-variant-id="${esc(v.id)}" aria-pressed="${v.id === dv.id}"${out ? ' disabled' : ''}><b>${esc(v.title)}</b><span>${Card.rupees(v.price)}</span>${vOff ? `<em>-${vOff}%</em>` : ''}</button>`;
  }).join('\n            ');

  const stockText = soon ? 'Coming soon' : (inStock ? 'In stock, ships in 1 to 2 business days' : 'Sold out right now');
  const buyButtons = soon
    ? `<a href="/#newsletter" class="btn btn--block" data-pdp-notify>Notify me when it launches</a>`
    : `<div class="qty" aria-label="Quantity">
              <button type="button" data-qty="-1" aria-label="Decrease quantity">−</button>
              <input type="number" value="1" min="1" max="20" inputmode="numeric" aria-label="Quantity" data-qty-input>
              <button type="button" data-qty="1" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="btn" data-pdp-add${inStock ? '' : ' disabled'}>${Card.BAG}<span>${inStock ? 'Add to cart' : 'Sold out'}</span></button>
            <button type="button" class="btn btn--ghost" data-pdp-buy${inStock ? '' : ' disabled'}>Buy now</button>`;

  const accordions = [];
  accordions.push(['Description', `<div class="acc-body">${esc(paragraphs(product.description).join('\n\n'))}</div>`, true]);
  if (facts && facts.howToUse) accordions.push(['How to use', `<div class="acc-body"><ol>${facts.howToUse.map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>`]);
  if (facts && facts.storage) accordions.push(['Storage', `<div class="acc-body">${esc(facts.storage)}</div>`]);
  accordions.push(['Shipping & replacements', `<div class="acc-body">Packed and dispatched within 1 to 2 business days. Delivery takes 3 to 7 business days to metro cities and 4 to 10 business days elsewhere. Shipping is free on orders above ₹499, otherwise ₹49.\n\nIf anything arrives damaged, wrong or spoiled, tell us within 48 hours and we will replace or refund it. <a href="/shipping-policy">Shipping policy</a> · <a href="/refund-policy">Refund policy</a></div>`]);
  if (facts && facts.maker) {
    const m = facts.maker;
    accordions.push(['Manufacturer & FSSAI', `<div class="acc-body">${esc(m.role)} ${esc(m.name)}, ${esc(m.address)}.\nFSSAI Lic. No. ${esc(m.fssai)}\nCountry of origin: India</div>`]);
  }

  const pdpData = {
    handle: product.handle,
    name: product.name,
    tags: product.tags || [],
    images,
    variants: product.variants.map(v => ({ id: v.id, title: v.title, price: Number(v.price), compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null, inStock: v.stockQuantity > 0 }))
  };

  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${partials.gtag()}

    <title>${name} | Gluten-free singhara food | MantraAQ</title>
    <meta name="description" content="${esc(desc)}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="canonical" href="${productUrl}">

    <meta property="og:type" content="product">
    <meta property="og:url" content="${productUrl}">
    <meta property="og:title" content="${name} | MantraAQ">
    <meta property="og:description" content="${esc(desc)}">
    <meta property="og:image" content="${esc(ogImage)}">
    <meta property="og:site_name" content="MantraAQ">
    <meta property="og:locale" content="en_IN">
    <meta property="product:price:amount" content="${lowestPrice}">
    <meta property="product:price:currency" content="INR">
    <meta property="product:availability" content="${inStock ? 'in stock' : 'out of stock'}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${name} | MantraAQ">
    <meta name="twitter:description" content="${esc(desc)}">
    <meta name="twitter:image" content="${esc(ogImage)}">

${partials.headAssets()}
    <link rel="preload" as="image" href="${esc(images[0])}">

    ${ldJson(buildProductSchema(product, productUrl))}
    ${ldJson(buildBreadcrumbSchema(product, productUrl))}
    ${ldJson(buildFaqSchema(faqs))}
</head>

<body class="site page-pdp">
<a class="skip-link" href="#main">Skip to content</a>

${partials.nav()}

<main id="main">
<article class="pdp" data-pdp="${esc(product.handle)}" style="--tint:${tint}">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/#products">Shop</a><span aria-hidden="true">/</span><span aria-current="page">${name}</span></nav>
    <div class="pdp-grid">
      <div class="pdp-gallery">
        ${thumbs ? `<div class="pdp-thumbs">\n          ${thumbs}\n        </div>` : '<div class="pdp-thumbs" hidden></div>'}
        <div>
          <div class="pdp-main" tabindex="0" aria-label="${name} images">
          ${gallery}
          </div>
          ${images.length > 1 ? `<div class="pdp-dots" aria-hidden="true">${images.map((_, i) => `<i${i === 0 ? ' class="is-active"' : ''}></i>`).join('')}</div>` : ''}
        </div>
      </div>

      <div class="pdp-info">
        <div class="pdp-kicker"><span class="pc-cat">${esc(product.category || 'Singhara')}</span>${badge ? `<span class="product-badge ${badge.cls}">${badge.label}</span>` : ''}<span class="pdp-rating" data-pdp-rating hidden></span></div>
        <h1>${name}</h1>
        <p class="pdp-sub">${esc(Card.tagline(product.description))}</p>
        <div class="pdp-price" data-pdp-price>
          <span class="now">${Card.rupees(dv.price)}</span>${off ? `<span class="was">${Card.rupees(dv.compareAtPrice)}</span><span class="off">${off}% OFF</span>` : ''}
          <span class="tax">Inclusive of all taxes</span>
        </div>
        <div>
          <div class="pdp-label">Size <span data-pdp-size-label>${esc(dv.title)}</span></div>
          <div class="pdp-sizes" role="group" aria-label="Choose size">
            ${sizes}
          </div>
        </div>
        <div class="pdp-buy">
            ${buyButtons}
        </div>
        <p class="pdp-stock${soon || !inStock ? ' is-out' : ''}" data-pdp-stock>${stockText}</p>
        <div class="pdp-ship">${TRUCK}<span><b>Free shipping</b> on orders above ₹499. Damaged or wrong item? We replace it.</span></div>
        ${highlights.length ? `<ul class="pdp-highlights">${highlights.map(h => `<li>${CHECK}${esc(h)}</li>`).join('')}</ul>` : ''}
        <div class="pdp-acc">
          ${accordions.map(([t, body, open]) => `<details${open ? ' open' : ''}><summary>${esc(t)}</summary>${body}</details>`).join('\n          ')}
        </div>
      </div>
    </div>
  </div>
</article>

${packSection(product, facts)}

<section class="section reviews" aria-labelledby="reviews-h" data-reviews data-reviews-handle="${esc(product.handle)}" hidden>
  <div class="wrap" data-rail>
    <div class="section-head">
      <div>
        <span class="eyebrow">Reviews</span>
        <h2 id="reviews-h" class="display-l">What customers <em class="serif-italic">say.</em></h2>
      </div>
      <div class="reviews-summary" data-reviews-summary></div>
    </div>
    <div class="rail"></div>
    <div class="rail-progress" aria-hidden="true"><i></i></div>
  </div>
</section>

<section class="section" aria-labelledby="pfaq-h">
  <div class="wrap faq-grid">
    <div data-reveal>
      <span class="eyebrow">Good to know</span>
      <h2 id="pfaq-h" class="display-l" style="margin-top:14px">${name}, <em class="serif-italic">answered.</em></h2>
      <p class="lead" style="margin:18px 0 26px">Still unsure? Message us on WhatsApp and a person from our team will reply.</p>
      <a href="https://wa.me/918283816755" class="link-arrow" target="_blank" rel="noopener">Chat on WhatsApp ${partials.ARROW}</a>
    </div>
    <div class="faq-list" data-reveal style="--d:.1s">
      ${faqs.map(([q, a], i) => `<details class="faq-item"${i === 0 ? ' open' : ''}><summary>${esc(q)}<i></i></summary><div class="faq-a"><p>${esc(a)}</p></div></details>`).join('\n      ')}
    </div>
  </div>
</section>

${railSection({ id: 'more-h', eyebrow: 'Keep exploring', title: 'More from the <em class="serif-italic">wetlands.</em>', exclude: product.handle, cards: railCards(allProducts, product.handle) })}
</main>

${partials.footer()}

<div class="sticky-buy" data-sticky-buy aria-hidden="true">
  <div><div class="sb-name">${name} · <span data-sb-size>${esc(dv.title)}</span></div><div class="sb-price" data-sb-price>${Card.rupees(dv.price)}</div></div>
  <button type="button" class="btn" data-sb-add${inStock && !soon ? '' : ' disabled'}>${soon ? 'Coming soon' : (inStock ? 'Add to cart' : 'Sold out')}</button>
</div>

<script type="application/json" id="pdp-data">${JSON.stringify(pdpData).replace(/</g, '\\u003c')}</script>
${partials.scripts(['/js/pdp.js'])}
</body>
</html>
`;
}

// ── Sitemap and llms.txt ──────────────────────────────────────────

function generateSitemap(products) {
  const today = new Date().toISOString().split('T')[0];
  const urls = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
    ...products.map(p => ({ loc: `${SITE_URL}/products/${p.handle}`, changefreq: 'weekly', priority: '0.9' })),
    { loc: `${SITE_URL}/faq`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_URL}/contact`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE_URL}/shipping-policy`, changefreq: 'monthly', priority: '0.4' },
    { loc: `${SITE_URL}/refund-policy`, changefreq: 'monthly', priority: '0.4' },
    { loc: `${SITE_URL}/privacy-policy`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${SITE_URL}/terms-and-conditions`, changefreq: 'yearly', priority: '0.3' }
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

/** Plain-text brand and catalogue summary for AI assistants (https://llmstxt.org). */
function generateLlmsTxt(products) {
  const lines = [
    '# MantraAQ',
    '',
    '> MantraAQ is an Indian food brand making singhara (water chestnut) foods from the wetlands of Bihar, sourced from 200+ farmer families. Products are gluten free, fasting friendly (vrat, Navratri) and maida free. Sold online at mantraaq.com with delivery across India.',
    '',
    'Company: MantraAQ Industries Private Limited, Begusarai, Bihar, India. FSSAI Lic. No. 20426155000003.',
    'Contact: hello@mantraaq.com, +91 82838 16755 (also WhatsApp).',
    'Shipping: dispatched in 1 to 2 business days; free shipping on orders above ₹499, otherwise ₹49. Damaged, wrong or spoiled items are replaced or refunded if reported within 48 hours.',
    '',
    '## Products',
    ''
  ];
  for (const p of products) {
    const facts = factsFor(p.handle);
    const prices = p.variants.map(v => `${v.title} ₹${Math.round(v.price)}`).join(', ');
    const status = Card.isComingSoon(p) ? 'coming soon' : (Card.isInStock(p) ? 'in stock' : 'currently sold out');
    let line = `- [${p.name}](${SITE_URL}/products/${p.handle}): ${Card.tagline(p.description)} Sizes: ${prices} (${status}).`;
    if (facts && facts.ingredients) line += ` Ingredients: ${facts.ingredients.join(', ')}.`;
    if (facts && facts.nutrition) {
      const kcal = facts.nutrition.rows.find(r => r[0] === 'Energy');
      const protein = facts.nutrition.rows.find(r => r[0] === 'Protein');
      const fibre = facts.nutrition.rows.find(r => r[0] === 'Dietary fibre');
      line += ` Per 100 g: ${[kcal, protein, fibre].filter(Boolean).map(r => `${r[0].toLowerCase()} ${r[1]}`).join(', ')}.`;
    }
    lines.push(line);
  }
  lines.push(
    '',
    '## Guides',
    '',
    `- [Singhara answered (FAQ)](${SITE_URL}/faq): what singhara is, nutrition, fasting use, storage and cooking.`,
    `- [Shipping policy](${SITE_URL}/shipping-policy)`,
    `- [Refund and replacement policy](${SITE_URL}/refund-policy)`,
    `- [Contact](${SITE_URL}/contact)`,
    ''
  );
  return lines.join('\n');
}

// ── Homepage injection ─────────────────────────────────────────────

function buildCatalogSchema(products) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'MantraAQ singhara foods',
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/products/${p.handle}`,
      name: p.name
    }))
  };
}

function replaceMarker(html, name, content) {
  const re = new RegExp(`<!-- ${name}_START -->[\\s\\S]*?<!-- ${name}_END -->`);
  if (!re.test(html)) return html;
  return html.replace(re, () => `<!-- ${name}_START -->\n${content}\n<!-- ${name}_END -->`);
}

function updateIndexHtml(products) {
  const indexPath = path.join(ROOT, 'index.html');
  if (!fs.existsSync(indexPath)) return;
  let html = fs.readFileSync(indexPath, 'utf-8');

  const cards = products.map((p, i) => Card.render(p, { index: i, eager: i < 2, resolveImage: pageImageUrl, fallbackImages: LOCAL_IMAGE_FALLBACK[p.handle] })).join('\n');
  html = replaceMarker(html, 'PRODUCTS', cards);
  html = replaceMarker(html, 'RAIL', railCards(products, null));
  html = replaceMarker(html, 'SCHEMA_PRODUCTS', `    <script id="static-product-schema" type="application/ld+json">\n${JSON.stringify(buildCatalogSchema(products), null, 2)}\n    </script>`);

  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log(`  ✅ Injected ${products.length} product cards, the bestseller rail and ItemList schema into index.html`);
}

// ── Data ───────────────────────────────────────────────────────────

async function fetchProducts(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  Fetching products from ${API_URL} (attempt ${attempt}/${retries})...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // Render cold starts can take ~50s
      const response = await fetch(`${API_URL}/storefront/products?limit=100`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`API responded with status ${response.status}`);
      const data = await response.json();
      if (!data.success || !data.products) throw new Error('API response missing products');
      return data.products;
    } catch (err) {
      console.warn(`  Attempt ${attempt} failed: ${err.message}`);
      if (attempt === retries) throw err;
      const delay = attempt * 15000;
      console.log(`  Waiting ${delay / 1000}s before retry...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

function readSnapshot() {
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8')).products;
}

/** Keep only public catalogue fields, and store stock as in/out so the file doesn't churn on every sale. */
function writeSnapshot(products) {
  const existing = fs.existsSync(SNAPSHOT_PATH) ? JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8')) : {};
  const slim = products.map(p => {
    const out = {};
    SNAPSHOT_FIELDS.forEach(k => { if (p[k] !== undefined) out[k] = p[k]; });
    out.variants = p.variants.map(v => {
      const vo = {};
      VARIANT_FIELDS.forEach(k => { if (v[k] !== undefined && v[k] !== null) vo[k] = v[k]; });
      vo.stockQuantity = v.stockQuantity > 0 ? 1 : 0;
      return vo;
    });
    out.avgRating = p.avgRating || null;
    out.reviewCount = p.reviewCount || 0;
    return out;
  });
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify({ _note: existing._note, products: slim }, null, 2) + '\n', 'utf-8');
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('🔨 MantraAQ static page generator');
  console.log('=================================\n');

  let products;
  if (process.argv.includes('--snapshot')) {
    products = readSnapshot();
    console.log(`  Using ${products.length} products from scripts/catalog-snapshot.json\n`);
  } else {
    try {
      products = await fetchProducts();
      console.log(`\n✅ Fetched ${products.length} products from the API\n`);
      writeSnapshot(products);
    } catch (err) {
      console.error(`\n❌ Could not fetch products from the API: ${err.message}`);
      console.error('   Keeping the committed product pages. Run with --snapshot to rebuild from the last known catalogue.\n');
      process.exit(0); // Don't fail the Vercel build
    }
  }

  const activeProducts = Card.sortForShelf(products.filter(p => p.isActive !== false && p.variants && p.variants.length > 0));
  if (activeProducts.length === 0) {
    console.warn('⚠️ No active products found. Skipping page generation.');
    process.exit(0);
  }

  if (fs.existsSync(OUTPUT_DIR)) {
    const existingFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.html'));
    existingFiles.forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
    console.log(`  Cleaned ${existingFiles.length} existing product pages`);
  } else {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const product of activeProducts) {
    fs.writeFileSync(path.join(OUTPUT_DIR, `${product.handle}.html`), generateProductHTML(product, activeProducts), 'utf-8');
    console.log(`  ✅ Generated /products/${product.handle}`);
  }

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), generateSitemap(activeProducts), 'utf-8');
  fs.writeFileSync(path.join(ROOT, 'llms.txt'), generateLlmsTxt(activeProducts), 'utf-8');
  console.log(`\n✅ Updated sitemap.xml and llms.txt`);

  updateIndexHtml(activeProducts);

  console.log(`\n🎉 Done: ${activeProducts.length} product pages, index.html, sitemap.xml and llms.txt.\n`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Build script error:', err);
    process.exit(0); // Don't fail the Vercel build
  });
}

module.exports = { generateProductHTML, generateSitemap, generateLlmsTxt, buildProductSchema };
