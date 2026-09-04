/**
 * MantraAQ Static Product Page Generator
 * 
 * Fetches all active products from the backend API at build time
 * and generates individual static HTML pages for SEO crawlability.
 * 
 * Also regenerates sitemap.xml with product URLs.
 * 
 * Run: node scripts/generate-products.js
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://mantraaq.com';
const API_URL = 'https://mantraaq-backend.onrender.com/api';
const OUTPUT_DIR = path.join(__dirname, '..', 'products');

// Fallback images for products when database images array is empty
const LOCAL_IMAGE_FALLBACK = {
  'singhara-pasta-macaroni': ['assets/images/products/pasta-macaroni-1.png'],
  'singhara-vermicell':     ['assets/images/products/vermicelli-1.png'],
  'singhara-atta':           ['assets/images/products/atta-1.png'],
  'fresh-singhara':          ['assets/images/products/fresh-singhara-1.png'],
  'dry-singhara':            ['assets/images/products/dry-singhara-1.png'],
  'singhara-snacks':         ['assets/images/products/singhara-snacks-1.png'],
};

/**
 * Resolve an image URL to an absolute URL
 */
function resolveImageUrl(url) {
  if (!url) return `${SITE_URL}/assets/images/placeholder.png`;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('uploads/')) return `https://mantraaq-backend.onrender.com/${url}`;
  return url.startsWith('/') ? `${SITE_URL}${url}` : `${SITE_URL}/${url}`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Truncate description for meta tag (max ~160 chars)
 */
function metaDescription(desc) {
  if (!desc) return 'Premium quality product from MantraAQ. Gluten-free, QR-traceable superfood sourced directly from Bihar farmers.';
  const clean = desc.replace(/\s+/g, ' ').trim();
  if (clean.length <= 160) return clean;
  return clean.substring(0, 157) + '...';
}

/**
 * Build Product + Offer JSON-LD structured data
 */
function buildProductSchema(product, productUrl) {
  const defaultVariant = product.variants[0];
  const fallback = LOCAL_IMAGE_FALLBACK[product.handle] || ['assets/images/placeholder.png'];
  const images = product.images && product.images.length > 0 ? product.images : fallback;
  const resolvedImages = images.map(img => resolveImageUrl(img));
  const inStock = product.variants.some(v => v.stockQuantity > 0);
  const lowestPrice = Math.min(...product.variants.map(v => v.price));
  const highestPrice = Math.max(...product.variants.map(v => v.price));

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `Premium quality ${product.name} from MantraAQ.`,
    "image": resolvedImages,
    "sku": defaultVariant.sku || product.handle,
    "brand": {
      "@type": "Brand",
      "name": "MantraAQ"
    },
    "url": productUrl,
    "category": product.category || "Food & Beverages",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "INR",
      "lowPrice": lowestPrice,
      "highPrice": highestPrice,
      "offerCount": product.variants.length,
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": productUrl,
      "seller": {
        "@type": "Organization",
        "name": "MantraAQ Industries Private Limited"
      }
    }
  };

  // Add aggregate rating if available
  if (product.avgRating && product.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.avgRating,
      "reviewCount": product.reviewCount
    };
  }

  return schema;
}

/**
 * Build BreadcrumbList JSON-LD
 */
function buildBreadcrumbSchema(product, productUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SITE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Products",
        "item": `${SITE_URL}/#products`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": productUrl
      }
    ]
  };
}

/**
 * Generate a full HTML page for a product
 */
function generateProductHTML(product, allProducts) {
  const productUrl = `${SITE_URL}/products/${product.handle}`;
  const defaultVariant = product.variants.find(v => v.stockQuantity > 0) || product.variants[0];
  const fallback = LOCAL_IMAGE_FALLBACK[product.handle] || ['assets/images/placeholder.png'];
  const images = product.images && product.images.length > 0 ? product.images : fallback;
  const resolvedImages = images.map(img => resolveImageUrl(img));
  const firstImage = resolvedImages[0] || `${SITE_URL}/assets/images/og-image.jpg`;
  const inStock = product.variants.some(v => v.stockQuantity > 0);
  const lowestPrice = Math.min(...product.variants.map(v => v.price));

  const productSchema = buildProductSchema(product, productUrl);
  const breadcrumbSchema = buildBreadcrumbSchema(product, productUrl);

  // Build variant rows for the price table
  const variantRows = product.variants.map(v => {
    const priceHtml = v.compareAtPrice && v.compareAtPrice > v.price
      ? `₹${v.price} <span style="text-decoration:line-through;color:#94a3b8;font-size:13px;">₹${v.compareAtPrice}</span>`
      : `₹${v.price}`;
    const stockLabel = v.stockQuantity > 0 ? `<span style="color:#16a34a;">In Stock</span>` : `<span style="color:#ef4444;">Out of Stock</span>`;
    return `<tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;">${escapeHtml(v.title)}</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;">${priceHtml}</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;">${stockLabel}</td></tr>`;
  }).join('');

  // Build related products links
  const relatedProducts = allProducts
    .filter(p => p.handle !== product.handle && p.isActive !== false)
    .slice(0, 4)
    .map(p => `<a href="/products/${p.handle}" style="display:block;padding:12px 16px;background:#f8fafc;border-radius:8px;text-decoration:none;color:#1e293b;font-weight:500;transition:background 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f8fafc'">${escapeHtml(p.name)} — from ₹${Math.min(...p.variants.map(v => v.price))}</a>`)
    .join('');

  // Build tags HTML
  const tagsHtml = (product.tags || [])
    .filter(t => !['bestseller', 'new-launch', 'seasonal', 'coming-soon'].includes(t.toLowerCase().replace(/\s+/g, '-')))
    .slice(0, 6)
    .map(t => `<span style="display:inline-block;padding:4px 12px;background:#f0fdf4;color:#166534;border-radius:20px;font-size:13px;font-weight:500;">${escapeHtml(t)}</span>`)
    .join(' ');

  // Build image gallery HTML (first image visible, rest hidden for SEO but present)
  const galleryHtml = resolvedImages.map((img, idx) =>
    `<img src="${escapeHtml(img)}" alt="${escapeHtml(product.name)}${idx > 0 ? ` - Image ${idx + 1}` : ''}" width="500" height="500" style="max-width:100%;height:auto;border-radius:12px;${idx > 0 ? 'margin-top:12px;' : ''}" loading="${idx === 0 ? 'eager' : 'lazy'}">`
  ).join('\n            ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-2EGQB9RZHD"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-2EGQB9RZHD');
    </script>

    <!-- Product Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(productSchema, null, 2)}
    </script>
    <script type="application/ld+json">
    ${JSON.stringify(breadcrumbSchema, null, 2)}
    </script>

    <!-- Basic Meta Tags -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    <!-- Primary SEO Meta Tags -->
    <title>${escapeHtml(product.name)} | MantraAQ — Premium Singhara Products</title>
    <meta name="description" content="${escapeHtml(metaDescription(product.description))}">
    <meta name="keywords" content="MantraAQ, ${escapeHtml(product.name)}, singhara, water chestnut, gluten-free, ${(product.tags || []).slice(0, 5).join(', ')}">
    <meta name="author" content="MantraAQ">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product">
    <meta property="og:url" content="${productUrl}">
    <meta property="og:title" content="${escapeHtml(product.name)} | MantraAQ">
    <meta property="og:description" content="${escapeHtml(metaDescription(product.description))}">
    <meta property="og:image" content="${escapeHtml(firstImage)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="MantraAQ">
    <meta property="og:locale" content="en_IN">
    <meta property="product:price:amount" content="${lowestPrice}">
    <meta property="product:price:currency" content="INR">
    <meta property="product:availability" content="${inStock ? 'in stock' : 'out of stock'}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${productUrl}">
    <meta name="twitter:title" content="${escapeHtml(product.name)} | MantraAQ">
    <meta name="twitter:description" content="${escapeHtml(metaDescription(product.description))}">
    <meta name="twitter:image" content="${escapeHtml(firstImage)}">

    <!-- Canonical URL -->
    <link rel="canonical" href="${productUrl}">

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/assets/images/logo.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/logo.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/logo.png">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Stylesheets -->
    <link href="/dist/output.css" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css">

    <style>
      .pdp-wrap { max-width: 900px; margin: 100px auto 60px; padding: 0 20px; font-family: 'Inter', system-ui, sans-serif; }
      .pdp-breadcrumb { font-size: 13px; color: #64748b; margin-bottom: 24px; }
      .pdp-breadcrumb a { color: #3b82f6; text-decoration: none; }
      .pdp-breadcrumb a:hover { text-decoration: underline; }
      .pdp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
      .pdp-images { display: flex; flex-direction: column; }
      .pdp-info h1 { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; color: #0f172a; margin: 0 0 12px; line-height: 1.2; }
      .pdp-price { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
      .pdp-desc { color: #475569; line-height: 1.7; margin-bottom: 20px; font-size: 15px; }
      .pdp-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
      .pdp-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
      .pdp-table th { padding: 10px 16px; background: #f1f5f9; text-align: left; font-weight: 600; color: #334155; border-bottom: 2px solid #e2e8f0; }
      .pdp-cta { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0f172a, #1e293b); color: #fff; font-weight: 600; font-size: 15px; border-radius: 10px; text-decoration: none; transition: transform 0.2s; }
      .pdp-cta:hover { transform: translateY(-2px); }
      .pdp-related { margin-top: 48px; }
      .pdp-related h2 { font-family: 'Playfair Display', serif; font-size: 1.5rem; margin-bottom: 16px; color: #0f172a; }
      .pdp-related-grid { display: flex; flex-direction: column; gap: 8px; }
      @media (max-width: 768px) {
        .pdp-grid { grid-template-columns: 1fr; gap: 24px; }
        .pdp-info h1 { font-size: 1.5rem; }
      }
    </style>
</head>
<body class="font-sans">
    <!-- Progress Bar -->
    <div class="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div id="progress-bar" class="h-full bg-gradient-to-r from-blue-500 to-orange-500 transition-all duration-150" style="width: 0%"></div>
    </div>

    <!-- Navbar -->
    <nav class="nav-bar" id="mainNav" role="navigation" aria-label="Main Navigation">
      <div class="nav-inner">
        <a href="/" class="nav-logo" id="navLogoLink">
          <div class="nav-logo-img-wrap">
            <img src="/assets/images/logo.png" alt="MantraAQ Logo" class="nav-logo-img" id="navLogoImg">
          </div>
          <span class="nav-logo-text">MantraAQ</span>
        </a>
        <div class="nav-links" id="navLinks">
          <a href="/#home" class="nav-link">Home</a>
          <a href="/#about-us" class="nav-link">About</a>
          <a href="/#products" class="nav-link">Products</a>
          <a href="/#contact" class="nav-link">Contact</a>
        </div>
        <div class="nav-actions">
          <a data-action="search" href="#" class="nav-action nav-account" title="Search Products">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span class="nav-action-label">Search</span>
          </a>
          <a data-action="wishlist" href="#" class="nav-action nav-account" title="My Wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            <span class="nav-action-label">Wishlist</span>
          </a>
          <a data-action="account" href="#" class="nav-action nav-account" title="My Account">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span class="nav-action-label">Account</span>
          </a>
          <a data-action="cart" href="#" class="nav-action nav-cart" title="Cart">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span>Cart</span>
          </a>
          <button class="nav-hamburger" id="navHamburger" aria-label="Toggle menu" aria-expanded="false" type="button">
            <span class="nav-ham-bar"></span><span class="nav-ham-bar"></span><span class="nav-ham-bar"></span>
          </button>
        </div>
      </div>
      <div class="nav-drawer" id="navDrawer" inert>
        <div class="nav-drawer-inner">
          <a href="/" class="nav-drawer-link">Home</a>
          <a href="/#about-us" class="nav-drawer-link">About</a>
          <a href="/#products" class="nav-drawer-link">Products</a>
          <a href="/#contact" class="nav-drawer-link">Contact</a>
        </div>
      </div>
    </nav>

    <!-- Product Detail Page -->
    <main class="pdp-wrap">
      <!-- Breadcrumb -->
      <nav class="pdp-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a> &rsaquo; <a href="/#products">Products</a> &rsaquo; <strong>${escapeHtml(product.name)}</strong>
      </nav>

      <div class="pdp-grid">
        <!-- Images -->
        <div class="pdp-images">
            ${galleryHtml}
        </div>

        <!-- Product Info -->
        <div class="pdp-info">
          <h1>${escapeHtml(product.name)}</h1>
          <div class="pdp-price">From ₹${lowestPrice}</div>
          <p class="pdp-desc">${escapeHtml(product.description || '')}</p>

          ${tagsHtml ? `<div class="pdp-tags">${tagsHtml}</div>` : ''}

          <!-- Variants Table -->
          <table class="pdp-table">
            <thead><tr><th>Size</th><th>Price</th><th>Availability</th></tr></thead>
            <tbody>${variantRows}</tbody>
          </table>

          <a href="/#products" class="pdp-cta">Shop Now on MantraAQ</a>
        </div>
      </div>

      <!-- Related Products (internal links for SEO) -->
      ${relatedProducts ? `
      <div class="pdp-related">
        <h2>More from MantraAQ</h2>
        <div class="pdp-related-grid">
          ${relatedProducts}
        </div>
      </div>` : ''}
    </main>

    <!-- Footer (minimal for SEO — links to policies) -->
    <footer style="background:#0f172a;color:#94a3b8;padding:40px 20px;margin-top:60px;font-family:'Inter',sans-serif;font-size:13px;">
      <div style="max-width:900px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:space-between;gap:24px;">
        <div>
          <strong style="color:#fff;font-size:15px;">MantraAQ</strong>
          <p style="margin:8px 0 0;">Premium Singhara (Water Chestnut) Products<br>From finest farms to your table.</p>
        </div>
        <div>
          <strong style="color:#e2e8f0;">Quick Links</strong>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px;">
            <a href="/" style="color:#94a3b8;text-decoration:none;">Home</a>
            <a href="/#products" style="color:#94a3b8;text-decoration:none;">All Products</a>
            <a href="/#contact" style="color:#94a3b8;text-decoration:none;">Contact</a>
          </div>
        </div>
        <div>
          <strong style="color:#e2e8f0;">Legal</strong>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px;">
            <a href="/shipping-policy.html" style="color:#94a3b8;text-decoration:none;">Shipping Policy</a>
            <a href="/privacy-policy.html" style="color:#94a3b8;text-decoration:none;">Privacy Policy</a>
            <a href="/terms-and-conditions.html" style="color:#94a3b8;text-decoration:none;">Terms & Conditions</a>
            <a href="/refund-policy.html" style="color:#94a3b8;text-decoration:none;">Refund Policy</a>
          </div>
        </div>
      </div>
      <div style="max-width:900px;margin:24px auto 0;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;text-align:center;">
        <p>&copy; ${new Date().getFullYear()} MantraAQ Industries Private Limited. All Rights Reserved.</p>
      </div>
    </footer>

    <!-- JS for cart/auth functionality on product pages -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.8/purify.min.js"></script>
    <script src="/js/sanitize.js"></script>
    <script src="/js/toast.js"></script>
    <script src="/js/api.js"></script>
    <script src="/js/cart.js"></script>
    <script src="/js/auth.js"></script>
    <script src="/js/search.js"></script>
    <script src="/js/wishlist.js"></script>
    <script src="/js/main.js"></script>
</body>
</html>`;
}

/**
 * Generate sitemap.xml with product URLs
 */
function generateSitemap(products) {
  const today = new Date().toISOString().split('T')[0];

  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/shipping-policy.html`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${SITE_URL}/privacy-policy.html`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${SITE_URL}/terms-and-conditions.html`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${SITE_URL}/refund-policy.html`, changefreq: 'monthly', priority: '0.5' },
  ];

  const productUrls = products.map(p => ({
    loc: `${SITE_URL}/products/${p.handle}`,
    changefreq: 'weekly',
    priority: '0.8',
  }));

  const allUrls = [...staticUrls, ...productUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

  return xml;
}

/**
 * Fetch products from the API with retry logic (handles Render cold starts)
 */
async function fetchProducts(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  Fetching products from API (attempt ${attempt}/${retries})...`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      const response = await fetch(`${API_URL}/storefront/products?limit=100`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.products) {
        throw new Error('API response missing products');
      }
      
      return data.products;
    } catch (err) {
      console.warn(`  Attempt ${attempt} failed: ${err.message}`);
      if (attempt < retries) {
        const delay = attempt * 15000; // 15s, 30s, 45s
        console.log(`  Waiting ${delay / 1000}s before retry...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Main build function
 */
async function main() {
  console.log('🔨 MantraAQ Static Product Page Generator');
  console.log('=========================================\n');

  // 1. Fetch products
  let products;
  try {
    products = await fetchProducts();
    console.log(`\n✅ Fetched ${products.length} products from API\n`);
  } catch (err) {
    console.error(`\n❌ FATAL: Could not fetch products from API: ${err.message}`);
    console.error('   The backend may be down. Product pages will NOT be generated.');
    console.error('   The site will still work — it just won\'t have static product pages.\n');
    process.exit(0); // Exit gracefully so Vercel build doesn't fail
  }

  // Filter active products with variants
  const activeProducts = products.filter(p => p.isActive !== false && p.variants && p.variants.length > 0);
  
  if (activeProducts.length === 0) {
    console.warn('⚠️ No active products found. Skipping page generation.');
    process.exit(0);
  }

  // 2. Create output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    // Clean existing generated pages
    const existingFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.html'));
    existingFiles.forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
    console.log(`  Cleaned ${existingFiles.length} existing product pages`);
  } else {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 3. Generate individual product pages
  for (const product of activeProducts) {
    const html = generateProductHTML(product, activeProducts);
    const filePath = path.join(OUTPUT_DIR, `${product.handle}.html`);
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`  ✅ Generated: /products/${product.handle}`);
  }

  // 4. Generate updated sitemap.xml
  const sitemapXml = generateSitemap(activeProducts);
  const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');
  console.log(`\n✅ Updated sitemap.xml with ${activeProducts.length} product URLs`);

  console.log(`\n🎉 Done! Generated ${activeProducts.length} static product pages.\n`);
}

main().catch(err => {
  console.error('Build script error:', err);
  process.exit(0); // Don't fail the Vercel build
});
