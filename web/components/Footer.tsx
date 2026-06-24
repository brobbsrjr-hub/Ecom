import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-accent text-white/80 mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <p
              className="font-display text-3xl text-white mb-4"
              style={{ fontStyle: 'italic' }}
            >
              Maison
            </p>
            <p className="text-sm leading-7 max-w-xs text-white/60">
              Thoughtfully designed objects for considered living. Each piece is made to be
              used, loved, and passed on.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-5">Shop</p>
            <ul className="space-y-3">
              {[
                { href: '/products', label: 'All Products' },
                { href: '/products?category=clothing', label: 'Clothing' },
                { href: '/products?category=accessories', label: 'Accessories' },
                { href: '/products?category=home', label: 'Home' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-5">Info</p>
            <ul className="space-y-3">
              {['About', 'Sustainability', 'Shipping & Returns', 'Care Guide', 'Contact'].map(
                (label) => (
                  <li key={label}>
                    <span className="text-sm text-white/70 cursor-default">{label}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-white/40">© 2026 Maison. All rights reserved.</p>
          <p className="text-xs text-white/30">Made with consideration for the planet.</p>
        </div>
      </div>
    </footer>
  )
}
