import ProductCard from '@/components/ProductCard'
import { products, categories } from '@/lib/products'
import Link from 'next/link'

type Props = {
  searchParams: Promise<{ category?: string }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category } = await searchParams

  const filtered = category
    ? products.filter((p) => p.category === category)
    : products

  const activeCategory = categories.find((c) => c.id === category)

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">
          {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
        </p>
        <h1
          className="font-display text-5xl sm:text-6xl text-fg"
          style={{ fontStyle: 'italic' }}
        >
          {activeCategory ? activeCategory.label : 'All Products'}
        </h1>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-12">
        <Link
          href="/products"
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            !category
              ? 'bg-accent text-white'
              : 'bg-surface text-muted hover:text-fg hover:bg-border'
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.id}`}
            className={`px-4 py-2 rounded-full text-sm transition-colors capitalize ${
              category === cat.id
                ? 'bg-accent text-white'
                : 'bg-surface text-muted hover:text-fg hover:bg-border'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-muted">No products found in this category.</p>
        </div>
      )}
    </div>
  )
}
