'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/cart-store'
import type { Product } from '@/lib/products'
import { Plus } from 'lucide-react'
import { useState } from 'react'

type Props = {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-surface aspect-[4/5]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {product.badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-accent text-white text-xs font-medium rounded-full tracking-wide">
            {product.badge}
          </span>
        )}

        <button
          onClick={handleAdd}
          aria-label={`Add ${product.name} to cart`}
          className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-card-hover ${
            added
              ? 'bg-accent text-white scale-95'
              : 'bg-card/90 text-fg backdrop-blur-sm opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
        >
          {added ? (
            'Added'
          ) : (
            <>
              <Plus size={14} strokeWidth={2} />
              Add
            </>
          )}
        </button>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-xs text-muted uppercase tracking-widest">{product.category}</p>
        <h3 className="text-base font-medium text-fg leading-snug group-hover:text-accent transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-muted">${product.price.toLocaleString()}</p>
      </div>
    </Link>
  )
}
