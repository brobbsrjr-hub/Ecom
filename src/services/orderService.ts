import { Order, OrderItem, OrderStatus, ShippingAddress } from '../models/order';
import { getProduct } from './productService';
import { getOrCreateCart, clearCart } from './cartService';
import { reserveStock, releaseStock } from './inventoryService';
import { sendOrderConfirmation } from './emailService';

const orders = new Map<string, Order>();

let orderIdCounter = 1;

function generateOrderId(): string {
  return `ord_${String(orderIdCounter++).padStart(8, '0')}`;
}

const TAX_RATES: Record<string, number> = {
  CA: 0.0875,
  NY: 0.08,
  TX: 0.0825,
  FL: 0.06,
  WA: 0.065,
  DEFAULT: 0.05,
};

function getTaxRate(state: string): number {
  return TAX_RATES[state.toUpperCase()] ?? TAX_RATES['DEFAULT'];
}

const SHIPPING_RATES: Record<string, number> = {
  standard: 5.99,
  express: 14.99,
  overnight: 29.99,
};

export interface CreateOrderInput {
  userId: string;
  shippingAddress: ShippingAddress;
  shippingMethod?: 'standard' | 'express' | 'overnight';
  notes?: string;
}

export function createOrder(input: CreateOrderInput): Order {
  const cart = getOrCreateCart(input.userId);

  if (cart.items.length === 0) {
    throw new Error('Cannot create order from empty cart');
  }

  const orderItems: OrderItem[] = cart.items.map(item => {
    const product = getProduct(item.productId);
    const variant = product.variants.find(v => v.id === item.variantId);
    if (!variant) {
      throw new Error(`Variant ${item.variantId} no longer exists`);
    }
    if (variant.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${item.productName}`);
    }

    return {
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    };
  });

  for (const item of orderItems) {
    reserveStock(item.variantId, item.quantity);
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = getTaxRate(input.shippingAddress.state);
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const shippingAmount = SHIPPING_RATES[input.shippingMethod ?? 'standard'];
  const discountAmount = cart.discountAmount;
  const total = Math.round((subtotal + taxAmount + shippingAmount - discountAmount) * 100) / 100;

  const id = generateOrderId();
  const now = new Date();

  const order: Order = {
    id,
    userId: input.userId,
    items: orderItems,
    status: OrderStatus.PENDING,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount,
    taxRate,
    shippingAmount,
    discountAmount,
    total,
    promoCode: cart.promoCode,
    shippingAddress: input.shippingAddress,
    createdAt: now,
    updatedAt: now,
    notes: input.notes,
  };

  orders.set(id, order);
  clearCart(input.userId);
  sendOrderConfirmation(input.userId, order);

  return order;
}

export function getOrder(orderId: string): Order {
  const order = orders.get(orderId);
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }
  return order;
}

export function listUserOrders(userId: string, page = 1, limit = 10): {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
} {
  const userOrders = Array.from(orders.values())
    .filter(o => o.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = userOrders.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginated = userOrders.slice(start, start + limit);

  return { orders: paginated, total, page, totalPages };
}

export function cancelOrder(orderId: string, userId: string): Order {
  const order = getOrder(orderId);

  if (order.userId !== userId) {
    throw new Error('Unauthorized: order does not belong to this user');
  }

  const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
  if (!cancellableStatuses.includes(order.status)) {
    throw new Error(`Cannot cancel order in status: ${order.status}`);
  }

  for (const item of order.items) {
    releaseStock(item.variantId, item.quantity);
  }

  order.status = OrderStatus.CANCELLED;
  order.updatedAt = new Date();
  return order;
}

export function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Order {
  const order = getOrder(orderId);

  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: [],
  };

  if (!validTransitions[order.status].includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${order.status} to ${newStatus}`,
    );
  }

  order.status = newStatus;
  order.updatedAt = new Date();
  return order;
}

export function calculateOrderTotal(
  items: Array<{ unitPrice: number; quantity: number }>,
  state: string,
  shippingMethod: 'standard' | 'express' | 'overnight' = 'standard',
  discountAmount = 0,
): {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
} {
  const subtotal = Math.round(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100,
  ) / 100;

  const taxRate = getTaxRate(state);
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const shippingAmount = SHIPPING_RATES[shippingMethod];
  const total = Math.round(
    (subtotal + taxAmount + shippingAmount - discountAmount) * 100,
  ) / 100;

  return { subtotal, taxRate, taxAmount, shippingAmount, discountAmount, total };
}

export function _resetStore(): void {
  orders.clear();
  orderIdCounter = 1;
}
