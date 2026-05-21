export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PromoCode {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrderAmount: number;
  maxUsageCount: number;
  usageCount: number;
  expiresAt: Date;
  isActive: boolean;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  promoCode?: string;
  discountAmount: number;
  subtotal: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}
