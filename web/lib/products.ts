export type Product = {
  id: string
  name: string
  category: 'clothing' | 'accessories' | 'home'
  price: number
  description: string
  details: string[]
  image: string
  badge?: string
}

export const categories = [
  { id: 'clothing', label: 'Clothing', image: 'https://picsum.photos/seed/maison-clothing/800/600' },
  { id: 'accessories', label: 'Accessories', image: 'https://picsum.photos/seed/maison-access/800/600' },
  { id: 'home', label: 'Home', image: 'https://picsum.photos/seed/maison-home/800/600' },
] as const

export const products: Product[] = [
  {
    id: 'merino-turtleneck',
    name: 'Merino Wool Turtleneck',
    category: 'clothing',
    price: 195,
    description: 'Crafted from 100% Grade-A New Zealand merino wool. Incredibly soft, naturally temperature-regulating, and built to last through a decade of winters.',
    details: ['100% Grade-A Merino Wool', 'Ribbed turtleneck collar', 'Regular unisex fit', 'Machine wash gentle', 'Available in 6 colorways'],
    image: 'https://picsum.photos/seed/merino-knit/600/750',
    badge: 'Bestseller',
  },
  {
    id: 'linen-blazer',
    name: 'Unstructured Linen Blazer',
    category: 'clothing',
    price: 285,
    description: 'A relaxed, unstructured blazer in premium Belgian linen. The kind of jacket that looks equally at home at a gallery opening or a beach dinner.',
    details: ['100% Belgian Linen', 'Unlined for breathability', 'Patch pockets', 'Relaxed fit', 'Dry clean recommended'],
    image: 'https://picsum.photos/seed/linen-jacket/600/750',
  },
  {
    id: 'organic-hoodie',
    name: 'Organic Cotton Hoodie',
    category: 'clothing',
    price: 145,
    description: 'Our most requested piece, now in organic cotton. Brushed fleece interior, substantial weight, and a fit designed for real bodies.',
    details: ['100% GOTS-certified Organic Cotton', 'Brushed fleece interior', 'Kangaroo pocket', 'Boxy, relaxed fit', 'Machine washable'],
    image: 'https://picsum.photos/seed/organic-hood/600/750',
  },
  {
    id: 'canvas-trousers',
    name: 'Wide-Leg Canvas Trousers',
    category: 'clothing',
    price: 175,
    description: 'Easy, wide-leg trousers in a substantial cotton canvas. Elastic waistband with a drawstring for adjustable fit — durable enough for everyday.',
    details: ['98% Cotton, 2% Elastane', 'Elastic waistband with drawstring', 'Two side pockets, one back pocket', 'Wide leg, high rise', 'Machine wash cold'],
    image: 'https://picsum.photos/seed/canvas-pants/600/750',
    badge: 'New',
  },
  {
    id: 'leather-tote',
    name: 'Full-Grain Leather Tote',
    category: 'accessories',
    price: 385,
    description: 'Vegetable-tanned full-grain leather that will develop a beautiful patina over time. Spacious, structured, and made to be carried every day for years.',
    details: ['Full-grain vegetable-tanned leather', 'Cotton canvas lining', 'Interior zip pocket', 'Magnetic closure', 'Fits 13" laptop'],
    image: 'https://picsum.photos/seed/leather-bag/600/750',
    badge: 'Limited',
  },
  {
    id: 'wool-bucket-hat',
    name: 'Boiled Wool Bucket Hat',
    category: 'accessories',
    price: 85,
    description: 'Dense, water-resistant boiled wool in a classic bucket silhouette. One size fits most, with an internal sweatband for comfort.',
    details: ['100% Boiled Wool', 'Water-resistant finish', 'Cotton sweatband', 'One size (58cm)', 'Spot clean only'],
    image: 'https://picsum.photos/seed/wool-hat-premium/600/750',
  },
  {
    id: 'silk-scarf',
    name: 'Silk Twill Scarf',
    category: 'accessories',
    price: 125,
    description: 'Printed on 14mm silk twill in collaboration with a Florentine textile studio. Each colorway is a limited edition of 200 pieces.',
    details: ['14mm silk twill', 'Hand-rolled edges', '90 × 90 cm', 'Dry clean only', 'Limited edition of 200'],
    image: 'https://picsum.photos/seed/silk-scarf-italy/600/750',
    badge: 'Limited',
  },
  {
    id: 'wool-cap',
    name: 'Ribbed Cashmere Beanie',
    category: 'accessories',
    price: 95,
    description: 'Pure Grade-A cashmere in a classic ribbed construction. Lightweight enough for early autumn, warm enough for mid-winter.',
    details: ['100% Grade-A Cashmere', 'Fine-gauge 2×2 rib', 'Fold-up cuff', 'One size fits most', 'Hand wash cold'],
    image: 'https://picsum.photos/seed/cashmere-beanie/600/750',
  },
  {
    id: 'linen-throw',
    name: 'Stonewashed Linen Throw',
    category: 'home',
    price: 165,
    description: 'Pre-washed Belgian linen that only gets softer with time. Generous dimensions for wrapping around the sofa or doubling as a lightweight summer blanket.',
    details: ['100% Pre-washed Belgian Linen', '150 × 200 cm', 'Hemstitched edges', 'Machine wash cold', 'Available in 4 colors'],
    image: 'https://picsum.photos/seed/linen-throw-home/600/750',
  },
  {
    id: 'ceramic-mug',
    name: 'Hand-Thrown Ceramic Mug',
    category: 'home',
    price: 55,
    description: 'Each mug is thrown by hand in a small studio in Cornwall. Slight variations in form and glaze make every piece unique. Dishwasher safe.',
    details: ['Stoneware ceramic', 'Matte glaze interior', 'Holds 320ml', 'Dishwasher safe', 'Sold individually'],
    image: 'https://picsum.photos/seed/ceramic-studio/600/750',
    badge: 'Handmade',
  },
  {
    id: 'oak-board',
    name: 'Solid Oak Serving Board',
    category: 'home',
    price: 95,
    description: 'Thick-cut solid oak with a food-safe oil finish. Large enough for a generous cheese selection, elegant enough to bring straight from kitchen to table.',
    details: ['Solid European Oak', '45 × 25 × 2 cm', 'Food-safe oil finish', 'Hand wash only', 'Re-oil periodically'],
    image: 'https://picsum.photos/seed/oak-board-kitchen/600/750',
  },
  {
    id: 'candle-set',
    name: 'Botanical Candle Set',
    category: 'home',
    price: 75,
    description: 'Three candles in hand-blown glass vessels, scented with single-origin botanical extracts. Cedar & Vetiver, Bergamot & White Tea, and Hinoki & Stone.',
    details: ['Natural soy wax blend', 'Cotton wick', '50-hour burn time each', 'Hand-blown glass vessel', 'Set of 3'],
    image: 'https://picsum.photos/seed/candle-botanical/600/750',
    badge: 'Gift Set',
  },
]

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category)
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.badge).slice(0, 4)
}
