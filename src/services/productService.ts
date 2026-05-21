import { Product, ProductVariant, Category, DiscountRule } from '../models/product';

const products = new Map<string, Product>();
const categories = new Map<string, Category>();

let productIdCounter = 1;
let categoryIdCounter = 1;

function generateId(prefix: string, counter: number): string {
  return `${prefix}_${String(counter).padStart(6, '0')}`;
}

export interface ListProductsOptions {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ListProductsResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProductInput {
  name: string;
  description: string;
  basePrice: number;
  categoryId: string;
  tags?: string[];
  variants?: Omit<ProductVariant, 'id' | 'productId'>[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  basePrice?: number;
  categoryId?: string;
  tags?: string[];
  isActive?: boolean;
}

export function getProduct(id: string): Product {
  const product = products.get(id);
  if (!product) {
    throw new Error(`Product not found: ${id}`);
  }
  return product;
}

export function listProducts(options: ListProductsOptions = {}): ListProductsResult {
  const {
    categoryId,
    minPrice,
    maxPrice,
    tags,
    search,
    isActive,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  let results = Array.from(products.values());

  if (categoryId !== undefined) {
    results = results.filter(p => p.categoryId === categoryId);
  }

  if (isActive !== undefined) {
    results = results.filter(p => p.isActive === isActive);
  }

  if (minPrice !== undefined) {
    results = results.filter(p => p.basePrice >= minPrice);
  }

  if (maxPrice !== undefined) {
    results = results.filter(p => p.basePrice <= maxPrice);
  }

  if (tags && tags.length > 0) {
    results = results.filter(p => tags.some(t => p.tags.includes(t)));
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }

  results.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'price') {
      cmp = a.basePrice - b.basePrice;
    } else if (sortBy === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else {
      cmp = a.createdAt.getTime() - b.createdAt.getTime();
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const total = results.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit);

  return { products: paginated, total, page, limit, totalPages };
}

export function createProduct(input: CreateProductInput): Product {
  if (!input.name || input.name.trim() === '') {
    throw new Error('Product name is required');
  }
  if (input.basePrice < 0) {
    throw new Error('Base price cannot be negative');
  }
  if (!categories.has(input.categoryId)) {
    throw new Error(`Category not found: ${input.categoryId}`);
  }

  const id = generateId('prod', productIdCounter++);
  const now = new Date();
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const variants: ProductVariant[] = (input.variants ?? []).map((v, i) => ({
    ...v,
    id: `${id}_var_${i + 1}`,
    productId: id,
  }));

  const product: Product = {
    id,
    name: input.name.trim(),
    slug: `${slug}-${id}`,
    description: input.description,
    basePrice: input.basePrice,
    categoryId: input.categoryId,
    variants,
    tags: input.tags ?? [],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  products.set(id, product);
  return product;
}

export function updateProduct(id: string, input: UpdateProductInput): Product {
  const product = getProduct(id);

  if (input.name !== undefined) {
    if (input.name.trim() === '') {
      throw new Error('Product name cannot be empty');
    }
    product.name = input.name.trim();
    product.slug =
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      id;
  }

  if (input.description !== undefined) {
    product.description = input.description;
  }

  if (input.basePrice !== undefined) {
    if (input.basePrice < 0) {
      throw new Error('Base price cannot be negative');
    }
    product.basePrice = input.basePrice;
  }

  if (input.categoryId !== undefined) {
    if (!categories.has(input.categoryId)) {
      throw new Error(`Category not found: ${input.categoryId}`);
    }
    product.categoryId = input.categoryId;
  }

  if (input.tags !== undefined) {
    product.tags = input.tags;
  }

  if (input.isActive !== undefined) {
    product.isActive = input.isActive;
  }

  product.updatedAt = new Date();
  products.set(id, product);
  return product;
}

export function deleteProduct(id: string): void {
  if (!products.has(id)) {
    throw new Error(`Product not found: ${id}`);
  }
  products.delete(id);
}

export function applyDiscount(productId: string, rule: DiscountRule): number {
  const product = getProduct(productId);
  const basePrice = product.basePrice;

  if (rule.minOrderAmount !== undefined && basePrice < rule.minOrderAmount) {
    return basePrice;
  }

  let discountedPrice: number;

  if (rule.type === 'percentage') {
    if (rule.value < 0 || rule.value > 100) {
      throw new Error('Percentage discount must be between 0 and 100');
    }
    const discount = (basePrice * rule.value) / 100;
    const cappedDiscount =
      rule.maxDiscountAmount !== undefined
        ? Math.min(discount, rule.maxDiscountAmount)
        : discount;
    discountedPrice = basePrice - cappedDiscount;
  } else {
    if (rule.value < 0) {
      throw new Error('Flat discount cannot be negative');
    }
    discountedPrice = Math.max(0, basePrice - rule.value);
  }

  return Math.round(discountedPrice * 100) / 100;
}

export function createCategory(name: string, parentId?: string): Category {
  const id = generateId('cat', categoryIdCounter++);
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const category: Category = { id, name, slug, parentId };
  categories.set(id, category);
  return category;
}

export function getCategory(id: string): Category {
  const cat = categories.get(id);
  if (!cat) throw new Error(`Category not found: ${id}`);
  return cat;
}

export function _resetStore(): void {
  products.clear();
  categories.clear();
  productIdCounter = 1;
  categoryIdCounter = 1;
}
