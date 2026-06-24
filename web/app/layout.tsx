import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/lib/cart-store'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Maison — Premium Lifestyle',
  description: 'Thoughtfully designed objects for considered living.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full`}>
      <body className="bg-bg text-fg font-sans antialiased min-h-full flex flex-col">
        <CartProvider>
          <Nav />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
