'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart-store'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Nav() {
  const { itemCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-bg/95 backdrop-blur-md border-b border-border shadow-card' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-fg hover:text-accent transition-colors"
          style={{ fontStyle: 'italic' }}
        >
          Maison
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { href: '/products', label: 'All Products' },
            { href: '/products?category=clothing', label: 'Clothing' },
            { href: '/products?category=accessories', label: 'Accessories' },
            { href: '/products?category=home', label: 'Home' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-muted hover:text-fg transition-colors tracking-wide"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface transition-colors"
            aria-label={`Cart, ${itemCount} items`}
          >
            <ShoppingBag size={20} strokeWidth={1.5} className="text-fg" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white text-xs font-medium">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <X size={20} strokeWidth={1.5} />
            ) : (
              <Menu size={20} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-bg z-40 flex flex-col p-8 gap-6">
          {[
            { href: '/products', label: 'All Products' },
            { href: '/products?category=clothing', label: 'Clothing' },
            { href: '/products?category=accessories', label: 'Accessories' },
            { href: '/products?category=home', label: 'Home' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="font-display text-3xl text-fg hover:text-accent transition-colors"
              style={{ fontStyle: 'italic' }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
