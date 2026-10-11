import {
  buildPromoVariables,
  displayPrice,
  firstSentence,
  formatPrice,
  PromoProduct,
  truncate,
} from '../../src/video/promoVariables';
import { toRows } from '../../src/video/renderPromos';

const serum: PromoProduct = {
  name: 'Golden Hour Vitamin C Serum',
  slug: 'golden-hour-serum',
  description: 'Brighter skin in 14 days. A lightweight serum with vitamin C.',
  basePrice: 39,
  tags: ['vitamin-c', 'fragrance_free', 'vegan', 'cruelty free'],
};

describe('buildPromoVariables', () => {
  it('maps a product to template variables', () => {
    const row = buildPromoVariables(serum, { shopUrl: 'glow.shop' });
    expect(row).toMatchObject({
      name: 'golden-hour-serum',
      productName: 'Golden Hour Vitamin C Serum',
      tagline: 'Brighter skin in 14 days.',
      badge: '',
      feature1: 'Vitamin c',
      feature2: 'Fragrance free',
      feature3: 'Vegan',
      price: '$39',
      compareAtPrice: '',
      shopUrl: 'glow.shop',
      cta: 'Shop now',
    });
  });

  it('shows the regular price struck through when on sale', () => {
    const row = buildPromoVariables(serum, { salePrice: 29.5 });
    expect(row.price).toBe('$29.50');
    expect(row.compareAtPrice).toBe('$39');
    expect(row.badge).toBe('SALE');
  });

  it('ignores a sale price that is not lower than the regular price', () => {
    const row = buildPromoVariables(serum, { salePrice: 45 });
    expect(row.price).toBe('$39');
    expect(row.compareAtPrice).toBe('');
  });

  it('prefers explicit features and leaves missing slots empty', () => {
    const row = buildPromoVariables(serum, { features: ['Fast shipping'] });
    expect([row.feature1, row.feature2, row.feature3]).toEqual(['Fast shipping', '', '']);
  });

  it('truncates text to the template limits', () => {
    const row = buildPromoVariables({ ...serum, name: 'An extremely long product name that goes on and on forever' });
    expect(row.productName.length).toBeLessThanOrEqual(48);
    expect(row.productName.endsWith('…')).toBe(true);
  });
});

describe('displayPrice', () => {
  it('uses the cheapest in-stock variant', () => {
    expect(
      displayPrice({ ...serum, variants: [{ price: 20, stock: 0 }, { price: 25, stock: 3 }, { price: 30, stock: 1 }] })
    ).toBe(25);
  });

  it('falls back to the base price when nothing is in stock', () => {
    expect(displayPrice({ ...serum, variants: [{ price: 20, stock: 0 }] })).toBe(39);
  });
});

describe('helpers', () => {
  it('formatPrice drops cents only for whole amounts', () => {
    expect(formatPrice(10)).toBe('$10');
    expect(formatPrice(10.5)).toBe('$10.50');
    expect(formatPrice(10, 'EUR', 'de-DE')).toBe('10\u00a0€');
  });

  it('firstSentence returns the first sentence or the whole text', () => {
    expect(firstSentence('One. Two.')).toBe('One.');
    expect(firstSentence('No punctuation')).toBe('No punctuation');
  });

  it('truncate breaks on a word boundary', () => {
    expect(truncate('hello wonderful world', 18)).toBe('hello wonderful…');
    expect(truncate('hello wonderful world', 12)).toBe('hello wonde…');
    expect(truncate('short', 12)).toBe('short');
  });
});

describe('toRows', () => {
  it('accepts bare products and {product, promo} entries, applying defaults', () => {
    const rows = toRows([serum, { product: { ...serum, slug: 'b' }, promo: { cta: 'Buy' } }], { shopUrl: 'x.co' });
    expect(rows.map(r => [r.name, r.cta, r.shopUrl])).toEqual([
      ['golden-hour-serum', 'Shop now', 'x.co'],
      ['b', 'Buy', 'x.co'],
    ]);
  });

  it('rejects duplicate or unsafe slugs', () => {
    expect(() => toRows([serum, serum])).toThrow('Duplicate product slug');
    expect(() => toRows([{ ...serum, slug: 'a/b' }])).toThrow("can't be used as a filename");
  });
});
