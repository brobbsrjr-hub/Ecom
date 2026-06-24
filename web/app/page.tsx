import Link from 'next/link'
import Image from 'next/image'
import ProductCard from '@/components/ProductCard'
import { products, categories } from '@/lib/products'
import { ArrowRight, Leaf, RefreshCcw, Package } from 'lucide-react'

const featured = products.filter((p) => p.badge).slice(0, 4)
const newArrivals = products.filter((p) => p.badge === 'New')

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-surface">
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface to-accent/10" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <p className="text-xs uppercase tracking-[0.2em] text-muted font-medium">
                Spring Collection 2026
              </p>
              <h1
                className="font-display text-6xl sm:text-7xl xl:text-8xl leading-none text-fg"
                style={{ fontStyle: 'italic' }}
              >
                Objects made
                <br />
                <span className="text-accent">to outlast</span>
                <br />
                trends.
              </h1>
              <p className="text-lg text-muted max-w-md leading-7">
                Premium materials, considered design. Each piece is built to be used every
                day and loved for a decade.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent-hover transition-colors"
                >
                  Shop Now
                  <ArrowRight size={16} strokeWidth={2} />
                </Link>
                <Link
                  href="/products?category=home"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-border text-fg rounded-full text-sm font-medium hover:border-fg transition-colors"
                >
                  Home Collection
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-modal">
                <Image
                  src="https://picsum.photos/seed/maison-hero/720/960"
                  alt="Featured collection"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card rounded-xl shadow-card-hover p-5 border border-border">
                <p className="text-xs text-muted uppercase tracking-widest mb-1">Featured</p>
                <p className="text-sm font-medium text-fg">{products[0].name}</p>
                <p className="text-sm text-accent font-medium mt-1">${products[0].price}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values strip */}
      <section className="border-y border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: Leaf, label: 'Sustainably sourced', desc: 'Natural materials, responsible suppliers' },
              { icon: Package, label: 'Designed to last', desc: 'No planned obsolescence' },
              { icon: RefreshCcw, label: 'Free returns', desc: '60-day no-questions-asked policy' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                  <Icon size={18} strokeWidth={1.5} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-fg">{label}</p>
                  <p className="text-xs text-muted mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="flex items-end justify-between mb-10">
          <h2
            className="font-display text-4xl sm:text-5xl text-fg"
            style={{ fontStyle: 'italic' }}
          >
            Browse by category
          </h2>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors"
          >
            All products <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className="group relative overflow-hidden rounded-2xl aspect-[4/3] block"
            >
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Collection</p>
                <p
                  className="font-display text-2xl text-white"
                  style={{ fontStyle: 'italic' }}
                >
                  {cat.label}
                </p>
              </div>
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={14} className="text-white" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted mb-2">Curated</p>
            <h2
              className="font-display text-4xl sm:text-5xl text-fg"
              style={{ fontStyle: 'italic' }}
            >
              Featured pieces
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Editorial banner */}
      <section className="relative overflow-hidden bg-accent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="space-y-4 max-w-xl">
            <p className="text-white/50 text-xs uppercase tracking-widest">Our approach</p>
            <h2
              className="font-display text-4xl sm:text-5xl text-white leading-tight"
              style={{ fontStyle: 'italic' }}
            >
              Buy less, choose well, make it last.
            </h2>
            <p className="text-white/60 text-base leading-7">
              We work with small workshops and family-run mills that have been producing
              exceptional materials for generations. Slow fashion, done properly.
            </p>
          </div>
          <Link
            href="/products"
            className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-white text-accent rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
          >
            Shop the collection
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="flex items-end justify-between mb-10">
            <h2
              className="font-display text-4xl sm:text-5xl text-fg"
              style={{ fontStyle: 'italic' }}
            >
              New arrivals
            </h2>
            <Link
              href="/products?category=clothing"
              className="hidden sm:flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors"
            >
              View clothing <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
