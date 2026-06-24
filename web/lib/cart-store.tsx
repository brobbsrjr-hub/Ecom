'use client'

import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { Product } from './products'

export type CartItem = {
  product: Product
  quantity: number
}

type CartState = {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD'; product: Product }
  | { type: 'REMOVE'; productId: string }
  | { type: 'INCREMENT'; productId: string }
  | { type: 'DECREMENT'; productId: string }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((i) => i.product.id === action.product.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      return { items: [...state.items, { product: action.product, quantity: 1 }] }
    }
    case 'REMOVE':
      return { items: state.items.filter((i) => i.product.id !== action.productId) }
    case 'INCREMENT':
      return {
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }
    case 'DECREMENT':
      return {
        items: state.items
          .map((i) =>
            i.product.id === action.productId ? { ...i, quantity: i.quantity - 1 } : i
          )
          .filter((i) => i.quantity > 0),
      }
    case 'CLEAR':
      return { items: [] }
    case 'HYDRATE':
      return { items: action.items }
    default:
      return state
  }
}

type CartContextValue = {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  incrementItem: (productId: string) => void
  decrementItem: (productId: string) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  useEffect(() => {
    try {
      const stored = localStorage.getItem('maison-cart')
      if (stored) {
        dispatch({ type: 'HYDRATE', items: JSON.parse(stored) })
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('maison-cart', JSON.stringify(state.items))
  }, [state.items])

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem: (product) => dispatch({ type: 'ADD', product }),
        removeItem: (productId) => dispatch({ type: 'REMOVE', productId }),
        incrementItem: (productId) => dispatch({ type: 'INCREMENT', productId }),
        decrementItem: (productId) => dispatch({ type: 'DECREMENT', productId }),
        clearCart: () => dispatch({ type: 'CLEAR' }),
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
