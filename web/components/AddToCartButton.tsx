'use client'

import { useCart } from '@/lib/cart-store'
import type { Product } from '@/lib/products'
import { ShoppingBag, Check } from 'lucide-react'
import { useState } from 'react'

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <button
      onClick={handleAdd}
      className={`w-full flex items-center justify-center gap-3 h-14 rounded-xl font-medium text-sm tracking-wide transition-all duration-200 ${
        added
          ? 'bg-accent/10 text-accent border border-accent'
          : 'bg-accent text-white hover:bg-accent-hover active:scale-[0.99]'
      }`}
    >
      {added ? (
        <>
          <Check size={16} strokeWidth={2} />
          Added to cart
        </>
      ) : (
        <>
          <ShoppingBag size={16} strokeWidth={1.5} />
          Add to cart
        </>
      )}
    </button>
  )
}
