/**
 * Refreshes the shared nav and footer (scripts/partials.js) inside hand-written pages.
 * Product pages get them from scripts/generate-products.js instead.
 *
 * Run: node scripts/build-partials.js
 */

const fs = require('fs');
const path = require('path');
const partials = require('./partials');

const ROOT = path.join(__dirname, '..');
const PAGES = [
  { file: 'index.html', home: true },
  { file: 'contact.html', home: false }
];

function replaceBetween(html, startTag, endTag, replacement, file) {
  const start = html.indexOf(startTag);
  const end = html.indexOf(endTag);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${file}: missing ${startTag} ... ${endTag} markers`);
  }
  return html.slice(0, start) + replacement + html.slice(end + endTag.length);
}

function build() {
  for (const page of PAGES) {
    const file = path.join(ROOT, page.file);
    if (!fs.existsSync(file)) {
      console.warn(`skip ${page.file}: not found`);
      continue;
    }
    let html = fs.readFileSync(file, 'utf8');
    html = replaceBetween(html, '<!-- NAV_START', '<!-- NAV_END -->', partials.nav({ home: page.home }), page.file);
    html = replaceBetween(html, '<!-- FOOTER_START', '<!-- FOOTER_END -->', partials.footer(), page.file);
    fs.writeFileSync(file, html);
    console.log(`updated ${page.file}`);
  }
}

if (require.main === module) build();

module.exports = { build, replaceBetween };
