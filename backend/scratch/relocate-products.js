const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../../index.html');
let content = fs.readFileSync(indexPath, 'utf8');

console.log('Original content length:', content.length);

// 1. Find the old products section
const oldStartTag = '<!-- PREMIUM PRODUCTS SECTION -->';
const oldEndTag = '<!-- ══════════════════════════════════════\r\n     CERTIFICATIONS';
const oldEndTagLF = '<!-- ══════════════════════════════════════\n     CERTIFICATIONS';

let startIndex = content.indexOf(oldStartTag);
let endIndex = content.indexOf(oldEndTag);

if (endIndex === -1) {
  endIndex = content.indexOf(oldEndTagLF);
}

if (startIndex === -1 || endIndex === -1) {
  console.error('❌ Could not find old products section tags!', { startIndex, endIndex });
  process.exit(1);
}

// Slice out the old products section, keeping certifications
const oldSection = content.substring(startIndex, endIndex);
console.log('Old products section length:', oldSection.length);

// Remove the old products section from the content
content = content.substring(0, startIndex) + content.substring(endIndex);

// 2. Find the new location (below the hero section, which ends at </section> right before ABOUT US)
const insertTag = `<!-- ========================================\r\n     ABOUT US — MANTRAAQ — FINAL`;
const insertTagLF = `<!-- ========================================\n     ABOUT US — MANTRAAQ — FINAL`;

let insertIndex = content.indexOf(insertTag);
if (insertIndex === -1) {
  insertIndex = content.indexOf(insertTagLF);
}

if (insertIndex === -1) {
  console.error('❌ Could not find insert location!');
  process.exit(1);
}

// Prepare the new dynamic products section HTML
const newProductsHTML = `<!-- ══════════════════════════════════════
     PRODUCTS — MANTRAAQ (DYNAMIC GRID)
     ══════════════════════════════════════ -->
    <section id="products" class="py-20 bg-gradient-to-b from-white to-gray-50 overflow-x-hidden" style="position: relative;">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <!-- Section Header -->
            <div class="text-center mb-16">
                <span
                    class="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4 uppercase tracking-wide">
                    Our Products
                </span>
                <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-serif">
                    Premium Singhara Collection
                </h2>
                <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                    From finest farms to your table. QR-traced, cold-processed, and packed with nutrition.
                </p>
            </div>

            <!-- Products Grid -->
            <div id="storefront-products-grid" class="storefront-products-grid mb-12">
                <!-- Dynamically loaded products will be injected here -->
            </div>

        </div>
    </section>

`;

// Insert the new products section at the insertion index
content = content.substring(0, insertIndex) + newProductsHTML + content.substring(insertIndex);

fs.writeFileSync(indexPath, content, 'utf8');
console.log('✅ Successfully relocated and updated products section in index.html!');
console.log('New content length:', content.length);
