import { Product, ProductVariant } from '../models/product';

/**
 * Variables accepted by the HyperFrames template in video/product-promo/index.html.
 * Keep in sync with that file's `data-composition-variables` declaration.
 */
export interface PromoVariables {
  productName: string;
  tagline: string;
  badge: string;
  feature1: string;
  feature2: string;
  feature3: string;
  price: string;
  compareAtPrice: string;
  cta: string;
  shopUrl: string;
  image: string;
  accent: string;
  bg: string;
}

/** One batch row: the template variables plus `name`, used for the output filename. */
export type PromoRow = PromoVariables & { name: string };

/** The subset of a Product the promo needs, so plain JSON exports work too. */
export type PromoProduct = Pick<Product, 'name' | 'slug' | 'description' | 'basePrice' | 'tags'> & {
  variants?: Pick<ProductVariant, 'price' | 'stock'>[];
};

export interface PromoOptions {
  /** Sale price; when lower than the regular price, the regular price is shown struck through. */
  salePrice?: number;
  currency?: string;
  locale?: string;
  shopUrl?: string;
  /** Image URL, or a path relative to the template folder (e.g. assets/products/serum.png). */
  image?: string;
  badge?: string;
  cta?: string;
  /** Up to three selling points; defaults to the product's tags. */
  features?: string[];
  accent?: string;
  bg?: string;
}

// Mirrors maxLength in the template's variable declarations.
const MAX_LENGTH: Partial<Record<keyof PromoVariables, number>> = {
  productName: 48,
  tagline: 64,
  badge: 16,
  feature1: 32,
  feature2: 32,
  feature3: 32,
  price: 12,
  compareAtPrice: 12,
  cta: 20,
  shopUrl: 40,
};

const DEFAULTS = {
  cta: 'Shop now',
  shopUrl: 'yourstore.com',
  image: 'assets/product-placeholder.svg',
  accent: '#f2a65a',
  bg: '#141016',
};

export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:-]+$/, '')}…`;
}

export function firstSentence(text: string): string {
  const match = text.trim().match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

export function formatPrice(amount: number, currency = 'USD', locale = 'en-US'): string {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Lowest price among in-stock variants, falling back to the base price. */
export function displayPrice(product: PromoProduct): number {
  const inStock = (product.variants ?? []).filter(v => v.stock > 0);
  if (inStock.length === 0) return product.basePrice;
  return Math.min(...inStock.map(v => v.price));
}

function humanizeTag(tag: string): string {
  const words = tag.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function buildPromoVariables(product: PromoProduct, options: PromoOptions = {}): PromoRow {
  const currency = options.currency ?? 'USD';
  const regular = displayPrice(product);
  const onSale = options.salePrice !== undefined && options.salePrice < regular;

  const features = (options.features ?? product.tags.map(humanizeTag)).filter(Boolean);

  const vars: PromoVariables = {
    productName: product.name,
    tagline: firstSentence(product.description),
    badge: options.badge ?? (onSale ? 'SALE' : ''),
    feature1: features[0] ?? '',
    feature2: features[1] ?? '',
    feature3: features[2] ?? '',
    price: formatPrice(onSale ? options.salePrice! : regular, currency, options.locale),
    compareAtPrice: onSale ? formatPrice(regular, currency, options.locale) : '',
    cta: options.cta ?? DEFAULTS.cta,
    shopUrl: options.shopUrl ?? DEFAULTS.shopUrl,
    image: options.image ?? DEFAULTS.image,
    accent: options.accent ?? DEFAULTS.accent,
    bg: options.bg ?? DEFAULTS.bg,
  };

  for (const [key, max] of Object.entries(MAX_LENGTH) as [keyof PromoVariables, number][]) {
    vars[key] = truncate(vars[key], max);
  }

  return { name: product.slug, ...vars };
}
