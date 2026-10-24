const { REPO_DIR, SITE_URL } = require('./imageStorage');

// Product images that were moved off Cloudinary (Oct 2026) and now live in the repo
// at assets/uploads/products/<public id>.webp. Old Cloudinary URLs still stored in
// the database are swapped for the new ones when products are read, so nothing has
// to be edited by hand and the database can be updated later at leisure.
const MIGRATED = new Set(require('../config/migrated-images.json'));
const CLOUDINARY_RE = /^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:.*\/)?mantraaq\/products\/([a-z0-9]+)\.[a-z0-9]+$/i;

function toHostedImageUrl(url) {
  const m = typeof url === 'string' ? CLOUDINARY_RE.exec(url) : null;
  return m && MIGRATED.has(m[1]) ? `${SITE_URL}/${REPO_DIR}/${m[1]}.webp` : url;
}

function rewriteImages(images) {
  return Array.isArray(images) ? images.map(toHostedImageUrl) : images;
}

module.exports = { toHostedImageUrl, rewriteImages };
