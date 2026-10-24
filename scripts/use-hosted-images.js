/**
 * Point the static storefront at the product images hosted in this repo
 * (assets/uploads/products/<public id>.webp) instead of their old Cloudinary URLs.
 *
 * Covers the pre-rendered pages, the catalogue snapshot and the shared <head>,
 * and drops the res.cloudinary.com preconnect hint. Only images listed in
 * backend/config/migrated-images.json are swapped. Safe to run more than once.
 *
 * Run from the repo root:  node scripts/use-hosted-images.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MIGRATED = new Set(require('../backend/config/migrated-images.json'));
const CLOUDINARY_URL = /https?:\/\/res\.cloudinary\.com\/[^/"'\s]+\/image\/upload\/(?:[^"'\s]*\/)?mantraaq\/products\/([a-z0-9]+)\.[a-z0-9]+/gi;
const PRECONNECT = /[ \t]*<link rel="preconnect" href="https:\/\/res\.cloudinary\.com" crossorigin>\r?\n/g;

function files() {
  const html = dir => fs.readdirSync(dir).filter(f => f.endsWith('.html')).map(f => path.join(dir, f));
  return [
    ...html(ROOT),
    ...html(path.join(ROOT, 'products')),
    path.join(__dirname, 'catalog-snapshot.json'),
    path.join(__dirname, 'partials.js'),
  ];
}

let changed = 0;
for (const file of files()) {
  const before = fs.readFileSync(file, 'utf8');
  const after = before
    .replace(CLOUDINARY_URL, (url, id) => (MIGRATED.has(id) ? `/assets/uploads/products/${id}.webp` : url))
    .replace(PRECONNECT, '');
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
    console.log(`  updated ${path.relative(ROOT, file)}`);
  }
}

const left = files().filter(f => /res\.cloudinary\.com\/[^"'\s]+\/image\/upload/.test(fs.readFileSync(f, 'utf8')));
console.log(`\n${changed} files updated.`);
if (left.length) {
  console.log('Still using Cloudinary images that are not in the repo:');
  left.forEach(f => console.log(`  ${path.relative(ROOT, f)}`));
}
