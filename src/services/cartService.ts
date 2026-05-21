import { Cart, CartItem, PromoCode } from '../models/cart';
import { getProduct } from './productService';

const carts = new Map<string, Cart>();
const promoCodes = new Map<string, PromoCode>();

let cartIdCounter = 1;

function generateCartId(): string {
  return `cart_${String(cartIdCounter++).padStart(6, '0')}`;
}

function recalculateCart(cart: Cart): void {
  cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
  cart.subtotal = Math.round(cart.subtotal * 100) / 100;

  if (cart.promoCode) {
    const promo = promoCodes.get(cart.promoCode);
    if (promo && promo.isActive) {
      if (promo.type === 'percentage') {
        cart.discountAmount = Math.round((cart.subtotal * promo.value) / 100 * 100) / 100;
      } else {
        cart.discountAmount = Math.min(promo.value, cart.subtotal);
      }
    } else {
      cart.discountAmount = 0;
      cart.promoCode = undefined;
    }
  } else {
    cart.discountAmount = 0;
  }

  cart.total = Math.round((cart.subtotal - cart.discountAmount) * 100) / 100;
  cart.updatedAt = new Date();
}

export function getOrCreateCart(userId: string): Cart {
  for (const cart of carts.values()) {
    if (cart.userId === userId) return cart;
  }

  const id = generateCartId();
  const now = new Date();
  const cart: Cart = {
    id,
    userId,
    items: [],
    discountAmount: 0,
    subtotal: 0,
    total: 0,
    createdAt: now,
    updatedAt: now,
  };
  carts.set(id, cart);
  return cart;
}

export function addToCart(
  userId: string,
  productId: string,
  variantId: string,
  quantity: number,
): Cart {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  const product = getProduct(productId);
  if (!product.isActive) {
    throw new Error('Product is not available');
  }

  const variant = product.variants.find(v => v.id === variantId);
  if (!variant) {
    throw new Error(`Variant not found: ${variantId}`);
  }

  if (variant.stock < quantity) {
    throw new Error(`Insufficient stock. Available: ${variant.stock}`);
  }

  const cart = getOrCreateCart(userId);

  const existingItem = cart.items.find(
    item => item.productId === productId && item.variantId === variantId,
  );

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (variant.stock < newQty) {
      throw new Error(`Insufficient stock. Available: ${variant.stock}`);
    }
    existingItem.quantity = newQty;
    existingItem.totalPrice = Math.round(existingItem.unitPrice * newQty * 100) / 100;
  } else {
    const item: CartItem = {
      productId,
      variantId,
      productName: product.name,
      variantName: variant.name,
      sku: variant.sku,
      quantity,
      unitPrice: variant.price,
      totalPrice: Math.round(variant.price * quantity * 100) / 100,
    };
    cart.items.push(item);
  }

  recalculateCart(cart);
  return cart;
}

export function removeFromCart(
  userId: string,
  productId: string,
  variantId: string,
): Cart {
  const cart = getOrCreateCart(userId);
  const index = cart.items.findIndex(
    item => item.productId === productId && item.variantId === variantId,
  );

  if (index === -1) {
    throw new Error('Item not found in cart');
  }

  cart.items.splice(index, 1);
  recalculateCart(cart);
  return cart;
}

export function updateQuantity(
  userId: string,
  productId: string,
  variantId: string,
  quantity: number,
): Cart {
  if (quantity < 0) {
    throw new Error('Quantity cannot be negative');
  }

  if (quantity === 0) {
    return removeFromCart(userId, productId, variantId);
  }

  const product = getProduct(productId);
  const variant = product.variants.find(v => v.id === variantId);
  if (!variant) {
    throw new Error(`Variant not found: ${variantId}`);
  }

  if (variant.stock < quantity) {
    throw new Error(`Insufficient stock. Available: ${variant.stock}`);
  }

  const cart = getOrCreateCart(userId);
  const item = cart.items.find(
    i => i.productId === productId && i.variantId === variantId,
  );

  if (!item) {
    throw new Error('Item not found in cart');
  }

  item.quantity = quantity;
  item.totalPrice = Math.round(item.unitPrice * quantity * 100) / 100;
  recalculateCart(cart);
  return cart;
}

export function calculateTotal(userId: string): {
  subtotal: number;
  discountAmount: number;
  total: number;
  itemCount: number;
} {
  const cart = getOrCreateCart(userId);
  recalculateCart(cart);

  return {
    subtotal: cart.subtotal,
    discountAmount: cart.discountAmount,
    total: cart.total,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function clearCart(userId: string): Cart {
  const cart = getOrCreateCart(userId);
  cart.items = [];
  cart.promoCode = undefined;
  cart.discountAmount = 0;
  cart.subtotal = 0;
  cart.total = 0;
  cart.updatedAt = new Date();
  return cart;
}

export function applyPromoCode(userId: string, code: string): Cart {
  const promo = promoCodes.get(code.toUpperCase());

  if (!promo) {
    throw new Error('Invalid promo code');
  }

  if (!promo.isActive) {
    throw new Error('Promo code is no longer active');
  }

  if (new Date() > promo.expiresAt) {
    throw new Error('Promo code has expired');
  }

  if (promo.usageCount >= promo.maxUsageCount) {
    throw new Error('Promo code usage limit reached');
  }

  const cart = getOrCreateCart(userId);

  if (cart.subtotal < promo.minOrderAmount) {
    throw new Error(
      `Minimum order amount of ${promo.minOrderAmount} required for this promo code`,
    );
  }

  cart.promoCode = code.toUpperCase();
  promo.usageCount += 1;
  recalculateCart(cart);
  return cart;
}

export function registerPromoCode(promo: PromoCode): void {
  promoCodes.set(promo.code.toUpperCase(), promo);
}

export function _resetStore(): void {
  carts.clear();
  promoCodes.clear();
  cartIdCounter = 1;
}
