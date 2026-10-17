# Product promo videos (HyperFrames)

`product-promo/` is a [HyperFrames](https://github.com/heygen-com/hyperframes) template: a 9-second,
1080×1920 (Reels / TikTok / Shorts) promo that renders from HTML to MP4. Every on-screen value is
a variable, so the same template renders one video per product.

Beats: hook (badge, name, tagline) → product shot + three selling points → price (with optional
struck-through compare-at price), CTA and shop URL.

## Requirements

Node 22+ and FFmpeg. The first render downloads HyperFrames' pinned Chrome (`npx hyperframes browser ensure`).

## Commands

```bash
npm run video:render -- video/sample-products.json            # one MP4 per product → video/renders/<slug>.mp4
npm run video:render -- products.json --quality delivery --shop-url mystore.com
npm run video:render -- products.json --dry-run               # only write video/renders/rows.json
npm run video:check                                           # lint + layout/contrast audit of the template
npm run video:preview                                         # open the template in HyperFrames Studio
```

Options: `--out <dir>`, `--quality draft|looks|delivery`, `--shop-url`, `--currency`, `--accent #hex`.

## Input format

A JSON array of products (the `Product` model, or just `name`, `slug`, `description`,
`basePrice`, `tags`, optional `variants`), each optionally wrapped with per-product options:

```json
[
  {
    "product": { "name": "…", "slug": "my-product", "description": "…", "basePrice": 39, "tags": ["vegan"] },
    "promo": { "salePrice": 29, "badge": "NEW", "image": "assets/products/my-product.png", "accent": "#f2a65a" }
  }
]
```

How products map to the video (`src/video/promoVariables.ts`):

| Video        | Source                                                                |
| ------------ | --------------------------------------------------------------------- |
| Name         | `product.name` (auto-sized to fit three lines)                        |
| Tagline      | first sentence of `product.description`                               |
| Features     | `promo.features`, else the first three `product.tags`                 |
| Price        | cheapest in-stock variant, else `basePrice`                           |
| Compare-at   | regular price, shown only when `promo.salePrice` is lower             |
| Badge        | `promo.badge`, else `SALE` when discounted, else hidden               |
| Image        | `promo.image` — put files in `product-promo/assets/` (transparent PNGs look best) |

Text is truncated to the template's limits so `--strict-variables` passes.
