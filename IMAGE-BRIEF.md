# MantraAQ photo brief

The new storefront ships with placeholder photos cut from the images the site already had.
Every placeholder sits at a fixed file name, so a new photo goes live by replacing that one file
(same name, same format). Product photos are different: they are uploaded in the admin panel.

## General rules (all photos)

- **Format:** send JPG or PNG at full resolution. We convert to WebP for the site.
- **Light:** soft natural daylight from one side. No flash, no harsh shadows, no filters.
- **Colour:** the site is cream, maroon, leaf green and gold, like the packs. Props in those tones
  (brass, terracotta, banana leaf, cream linen, dark wood) look right. Avoid blue, purple and neon.
- **Background for food cut-outs:** plain off-white or cream paper, seamless, nothing else in frame.
  The site blends these into its own background, so the paper must be clean and evenly lit.
- **People:** real farmers, real hands. Ask for consent before using anyone's face.
- **No text, watermarks or logos** added on top of photos.

## 1. Product photos (upload in the admin panel)

Upload 3 to 5 images per product. The **first image** is the one shown on product cards.

| # | Shot | Size | Notes |
|---|------|------|-------|
| 1 | Pack front, straight on | 2000 × 2000 px, square | Pack centred, 12% empty margin all round, cream paper background, soft shadow under it. This becomes the card image. |
| 2 | Pack at a 30° angle with the food beside it | 2000 × 2000 px | Pack left, a small bowl of the product right. |
| 3 | Product close-up (flour heap, pasta, dried singhara) | 2000 × 2000 px | Fill 70% of the frame. Shows texture. |
| 4 | Cooked dish | 2000 × 2000 px | Roti, halwa, pasta in sauce, kheer. Served in brass or ceramic. |
| 5 (optional) | Back of pack | 2000 × 2000 px | Nutrition table readable when zoomed. |

Admin accepts files up to 10 MB. Needed for: Singhara Atta, Singhara Macaroni (the "Singhara Pasta" product),
Singhara Vermicelli, Dry Singhara, Fresh Singhara, and the two products not yet in the admin
(Singhara Fusilli, Zesty Tangy flavour).

**Ready now:** the pack fronts from your label PDFs are cut out and saved in
`pack-images/` (shared project files), 1000 × 1000 WebP. Upload each as image 1 of its product
until real pack photos exist.

## 2. Homepage hero (replace the file in `assets/images/brand/`)

The hero shows each pack with its food in a bowl beside it. These are the bowls.

| File | Shot | Size |
|------|------|------|
| `hero-atta.webp` | Brass or ceramic bowl heaped with singhara atta, 3 whole dried singhara beside it | 1600 × 1600 px |
| `hero-pasta.webp` | Bowl of uncooked singhara macaroni, a few pieces spilling out | 1600 × 1600 px |
| `hero-vermicelli.webp` | Loose nest of singhara vermicelli in a bowl | 1600 × 1600 px |
| `hero-dry-singhara.webp` | Pile of dried whole singhara, some split open | 1600 × 1600 px |
| `hero-fresh-singhara.webp` | Fresh green and maroon singhara, still glossy | 1600 × 1600 px |

Shoot from about 35° above, on the cream paper background, subject filling 75% of the frame.

## 3. Pond to plate story (replace the file in `assets/images/brand/`)

Shown large on desktop (tall frame, cropped to the centre) and as cards on phones.
Keep the subject in the **middle third** of the frame so both crops work.

| File | Shot | Size |
|------|------|------|
| `story-1-harvest.webp` | Wide: farmers waist-deep in a Bihar pond at sunrise, harvesting | 2400 × 1600 px, landscape |
| `story-2-basket.webp` | Hands holding a basket of fresh singhara at the pond edge | 1600 × 2000 px, portrait |
| `story-3-plant.webp` | Close-up of the floating singhara plant with fruit | 1600 × 2000 px, portrait |
| `story-4-cold.webp` | Cleaning and milling: singhara on drying racks or flour coming out of the mill | 1600 × 2000 px, portrait |
| `story-5-pack.webp` | Packs being filled and sealed, QR code visible | 1600 × 2000 px, portrait |

## 4. Why MantraAQ tile

| File | Shot | Size |
|------|------|------|
| `why-wetland.webp` | Wide landscape of a Bihar wetland, calm water, golden light, no people needed | 2400 × 1600 px |

## 5. Shop by category tiles

Same rules as the hero bowls (cream paper background, subject only).

| File | Shot | Size |
|------|------|------|
| `category-flour.webp` | Small heap of atta with a wooden scoop | 1200 × 1200 px |
| `category-pasta.webp` | Macaroni and vermicelli side by side | 1200 × 1200 px |
| `category-whole.webp` | Dried and fresh singhara together | 1200 × 1200 px |
| `category-soon.webp` | Snack pack or GlowAQ bottle, any background (shown in a circle) | 1200 × 1200 px |

## 6. Recipe cards

Portrait, finished dish, styled for eating. Leave space at the top left for the cooking-time label.

| File | Dish | Size |
|------|------|------|
| `recipe-roti.webp` | Singhara rotis on a tawa or in a basket | 1600 × 2000 px |
| `recipe-halwa.webp` | Singhara atta halwa with ghee and nuts | 1600 × 2000 px |
| `recipe-pasta.webp` | Singhara macaroni in red sauce | 1600 × 2000 px |
| `recipe-kheer.webp` | Vermicelli kheer in a brass bowl | 1600 × 2000 px |
| `recipe-roasted.webp` | Roasted dry singhara as a snack | 1600 × 2000 px |
| `recipe-fresh.webp` | Fresh singhara peeled on a leaf plate | 1600 × 2000 px |

## 7. Social sharing image

| File | Shot | Size |
|------|------|------|
| `assets/images/og-image.jpg` | All packs lined up on cream with the logo, for WhatsApp and social link previews | 1200 × 630 px |

## How to hand them over

Put the photos in a shared folder named by the file names above (for example `hero-atta.jpg`)
and share the link in the project. We convert, compress and swap them in one change.
