'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/cart-store'
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react'

export default function CartPage() {
  const { items, removeItem, incrementItem, decrementItem, subtotal } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 text-center">
        <div className="max-w-sm mx-auto space-y-6">
          <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mx-auto">
            <ShoppingBag size={32} strokeWidth={1.2} className="text-muted" />
          </div>
          <h1
            className="font-display text-4xl text-fg"
            style={{ fontStyle: 'italic' }}
          >
            Your cart is empty
          </h1>
          <p className="text-muted text-base">
            Discover our collection of thoughtfully made pieces.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Browse products
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  const shipping = subtotal >= 150 ? 0 : 9.99
  const total = subtotal + shipping

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
      <h1
        className="font-display text-5xl text-fg mb-12"
        style={{ fontStyle: 'italic' }}
      >
        Your cart
      </h1>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Line items */}
        <div className="lg:col-span-2 space-y-6">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="flex gap-5 p-5 bg-card rounded-xl border border-border"
            >
              <Link href={`/products/${product.id}`} className="flex-shrink-0">
                <div className="relative w-24 h-28 rounded-lg overflow-hidden bg-surface">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              </Link>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-muted uppercase tracking-widest mb-1">
                    {product.category}
                  </p>
                  <Link href={`/products/${product.id}`}>
                    <p className="text-sm font-medium text-fg hover:text-accent transition-colors leading-snug">
                      {product.name}
                    </p>
                  </Link>
                  <p className="text-sm text-muted mt-1">${product.price.toLocaleString()}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 border border-border rounded-full">
                    <button
                      onClick={() => decrementItem(product.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                    <button
                      onClick={() => incrementItem(product.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-fg">
                      ${(product.price * quantity).toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="p-1.5 text-muted hover:text-fg transition-colors rounded-full hover:bg-surface"
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
            <h2 className="text-base font-medium text-fg mb-6">Order summary</h2>

            <div className="space-y-3 pb-6 border-b border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="text-fg">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Shipping</span>
                <span className={shipping === 0 ? 'text-accent text-sm' : 'text-fg text-sm'}>
                  {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              {subtotal < 150 && (
                <p className="text-xs text-muted bg-surface rounded-lg px-3 py-2">
                  Add ${(150 - subtotal).toFixed(2)} more for free shipping
                </p>
              )}
            </div>

            <div className="flex justify-between py-5">
              <span className="font-medium text-fg">Total</span>
              <span className="font-medium text-fg text-lg">${total.toFixed(2)}</span>
            </div>

            <button className="w-full flex items-center justify-center gap-2 h-13 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors">
              Proceed to checkout
              <ArrowRight size={16} />
            </button>

            <Link
              href="/products"
              className="mt-4 w-full flex items-center justify-center text-sm text-muted hover:text-fg transition-colors py-2"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
