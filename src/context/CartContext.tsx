'use client'
import { createContext, useContext, useEffect, useReducer } from 'react'
import type { CartItem, LoyaltyCard } from '@/types/cart'

interface CartState {
  items: CartItem[]
  loyalty: LoyaltyCard | null
}

type Action =
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; index: number }
  | { type: 'SET_QTY'; index: number; qty: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; state: CartState }

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.findIndex(i => i.sku === action.item.sku)
      if (existing >= 0) {
        const items = [...state.items]
        items[existing] = { ...items[existing], qty: items[existing].qty + action.item.qty }
        return { ...state, items }
      }
      return { ...state, items: [...state.items, action.item] }
    }
    case 'REMOVE': {
      const items = [...state.items]
      items.splice(action.index, 1)
      return { ...state, items }
    }
    case 'SET_QTY': {
      const items = [...state.items]
      items[action.index] = { ...items[action.index], qty: Math.max(1, action.qty) }
      return { ...state, items }
    }
    case 'CLEAR':
      return { ...state, items: [] }
    case 'HYDRATE':
      return action.state
    default:
      return state
  }
}

interface CartCtx extends CartState {
  add: (item: CartItem) => void
  remove: (index: number) => void
  setQty: (index: number, qty: number) => void
  clear: () => void
  total: number
  count: number
}

const CartContext = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], loyalty: null })

  useEffect(() => {
    const saved = localStorage.getItem('platforma_cart')
    const loyalty = localStorage.getItem('platforma_loyalty')
    dispatch({
      type: 'HYDRATE',
      state: {
        items: saved ? JSON.parse(saved) : [],
        loyalty: loyalty ? JSON.parse(loyalty) : null,
      },
    })
  }, [])

  useEffect(() => {
    localStorage.setItem('platforma_cart', JSON.stringify(state.items))
  }, [state.items])

  const total = state.items.reduce((s, i) => s + i.price * i.qty, 0)
  const count = state.items.reduce((s, i) => s + i.qty, 0)

  return (
    <CartContext.Provider value={{
      ...state,
      add: item => dispatch({ type: 'ADD', item }),
      remove: i => dispatch({ type: 'REMOVE', index: i }),
      setQty: (i, q) => dispatch({ type: 'SET_QTY', index: i, qty: q }),
      clear: () => dispatch({ type: 'CLEAR' }),
      total,
      count,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
