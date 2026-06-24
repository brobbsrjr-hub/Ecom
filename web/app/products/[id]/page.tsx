import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getProductById, products } from '@/lib/products'
import AddToCartButton from '@/components/AddToCartButton'
import ProductCard from '@/components/ProductCard'
import { ArrowLeft, Check } from 'lucide-react'

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }))
}

export async function generateMetadata(props: PageProps<'/products/[id]'>) {
  const { id } = await props.params
  const product = getProductById(id)
  if (!product) return {}
  return {
    title: `${product.name} — Maison`,
    description: product.description,
  }
}

export default async function ProductDetailPage(props: PageProps<'/products/[id]'>) {
  const { id } = await props.params
  const product = getProductById(id)

  if (!product) notFound()

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return (
    <div>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-10 text-sm text-muted">
          <Link href="/products" className="flex items-center gap-1 hover:text-fg transition-colors">
            <ArrowLeft size={14} />
            Products
          </Link>
          <span>/</span>
          <span className="capitalize">{product.category}</span>
          <span>/</span>
          <span className="text-fg">{product.name}</span>
        </div>

        {/* Product layout */}
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20">
          {/* Image */}
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-surface">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {product.badge && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-accent text-white text-xs font-medium rounded-full">
                {product.badge}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">{product.category}</p>
              <h1
                className="font-display text-4xl sm:text-5xl text-fg leading-tight mb-6"
                style={{ fontStyle: 'italic' }}
              >
                {product.name}
              </h1>
              <p className="text-2xl font-medium text-fg mb-8">
                ${product.price.toLocaleString()}
              </p>

              <p className="text-base text-muted leading-7 mb-10">{product.description}</p>

              <div className="border-t border-border pt-8 mb-10">
                <p className="text-xs uppercase tracking-[0.15em] text-muted mb-4 font-medium">Details</p>
                <ul className="space-y-3">
                  {product.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-3 text-sm text-fg">
                      <Check size={14} strokeWidth={2} className="text-accent mt-0.5 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <AddToCartButton product={product} />
              <p className="text-center text-xs text-muted">
                Free shipping on orders over $150 · Free returns within 60 days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t border-border">
          <h2
            className="font-display text-3xl sm:text-4xl text-fg mb-10"
            style={{ fontStyle: 'italic' }}
          >
            You might also like
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
