/**
 * Refreshes the shared nav and footer (scripts/partials.js) inside hand-written pages.
 * Product pages get them from scripts/generate-products.js instead.
 *
 * Run: node scripts/build-partials.js            (every page)
 *      node scripts/build-partials.js faq.html   (just the pages named)
 */

const fs = require('fs');
const path = require('path');
const partials = require('./partials');

const ROOT = path.join(__dirname, '..');
const PAGES = [
  { file: 'index.html', home: true },
  { file: 'contact.html', home: false },
  { file: 'faq.html', home: false, active: '/faq' },
  { file: 'shipping-policy.html', home: false },
  { file: 'refund-policy.html', home: false },
  { file: 'privacy-policy.html', home: false },
  { file: 'terms-and-conditions.html', home: false }
];

// Marks the nav link for the current page (desktop links and the mobile drawer).
function markActive(navHtml, href) {
  if (!href) return navHtml;
  return navHtml
    .replace(`href="${href}" class="nav-link"`, `href="${href}" class="nav-link nav-active" aria-current="page"`)
    .replace(`href="${href}" class="nav-drawer-link"`, `href="${href}" class="nav-drawer-link" aria-current="page"`);
}

function replaceBetween(html, startTag, endTag, replacement, file) {
  const start = html.indexOf(startTag);
  const end = html.indexOf(endTag);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${file}: missing ${startTag} ... ${endTag} markers`);
  }
  return html.slice(0, start) + replacement + html.slice(end + endTag.length);
}

// Optional file names limit the run, e.g. `node scripts/build-partials.js faq.html`.
function build(only = []) {
  for (const page of PAGES) {
    if (only.length && !only.includes(page.file)) continue;
    const file = path.join(ROOT, page.file);
    if (!fs.existsSync(file)) {
      console.warn(`skip ${page.file}: not found`);
      continue;
    }
    let html = fs.readFileSync(file, 'utf8');
    html = replaceBetween(html, '<!-- NAV_START', '<!-- NAV_END -->', markActive(partials.nav({ home: page.home }), page.active), page.file);
    html = replaceBetween(html, '<!-- FOOTER_START', '<!-- FOOTER_END -->', partials.footer(), page.file);
    fs.writeFileSync(file, html);
    console.log(`updated ${page.file}`);
  }
}

if (require.main === module) build(process.argv.slice(2));

module.exports = { build, replaceBetween };
