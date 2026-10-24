const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

// Product photos are shrunk to WebP before they are stored, so visitors download
// ~150 KB instead of a 2 MB original. 1400px covers the largest gallery view on
// a retina screen; cards render at 600px.
const MAX_WIDTH = 1400;
const WEBP_QUALITY = 82;

// New uploads are committed to the website repo and served by Vercel with the
// rest of the storefront, so hosting stays free with no bandwidth bill.
const REPO_DIR = 'assets/uploads/products';
const SITE_URL = (process.env.SITE_URL || 'https://mantraaq.com').replace(/\/+$/, '');

function githubConfigured() {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/** Resize + convert any supported image (path or Buffer) to a WebP Buffer. */
async function optimiseImage(input) {
  return sharp(input, { failOn: 'none' })
    .rotate() // honour EXIF orientation from phone photos
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

/** Commit a file to the website repo through the GitHub contents API. */
async function commitToRepo(repoPath, buffer, attempt = 1) {
  const api = process.env.GITHUB_API_URL || 'https://api.github.com';
  const res = await fetch(`${api}/repos/${process.env.GITHUB_REPO}/contents/${repoPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'mantraaq-backend',
    },
    body: JSON.stringify({
      // [skip render] stops Render redeploying the backend for an image-only commit;
      // Vercel still deploys it, which is what publishes the image.
      message: `Add product image ${path.basename(repoPath)} [skip render]`,
      content: buffer.toString('base64'),
      branch: process.env.GITHUB_BRANCH || 'main',
    }),
  });
  // 409 means another commit landed on the branch at the same moment; try again
  if (res.status === 409 && attempt < 3) {
    await new Promise(r => setTimeout(r, 1000 * attempt));
    return commitToRepo(repoPath, buffer, attempt + 1);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`GitHub upload failed (HTTP ${res.status}) ${detail.slice(0, 200)}`);
  }
}

/**
 * Store one product image and return its public URL.
 * Uses the GitHub repo when GITHUB_TOKEN and GITHUB_REPO are set; otherwise falls back
 * to Cloudinary (still optimised first), so deploying this before the token exists
 * changes nothing for the admin.
 */
async function storeProductImage(filePath) {
  const buffer = await optimiseImage(filePath);

  if (githubConfigured()) {
    const base = path.basename(filePath, path.extname(filePath)).replace(/[^a-z0-9-]/gi, '');
    const name = `${base || 'product'}-${crypto.randomBytes(4).toString('hex')}.webp`;
    await commitToRepo(`${REPO_DIR}/${name}`, buffer);
    return `${SITE_URL}/${REPO_DIR}/${name}`;
  }

  if (cloudinaryConfigured()) {
    const cloudinary = require('../config/cloudinary');
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'mantraaq/products', format: 'webp' }, (err, res) => (err ? reject(err) : resolve(res)))
        .end(buffer);
    });
    return result.secure_url;
  }

  throw new Error('No image storage configured (set GITHUB_TOKEN and GITHUB_REPO).');
}

module.exports = {
  REPO_DIR,
  SITE_URL,
  optimiseImage,
  storeProductImage,
};
