'use client'
import { createContext, useContext, useState } from 'react'

interface UICtx {
  cartOpen: boolean
  openCart: () => void
  closeCart: () => void
  checkoutOpen: boolean
  openCheckout: () => void
  closeCheckout: () => void
}

const UIContext = createContext<UICtx | null>(null)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  return (
    <UIContext.Provider value={{
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      checkoutOpen,
      openCheckout: () => { setCartOpen(false); setCheckoutOpen(true) },
      closeCheckout: () => setCheckoutOpen(false),
    }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
