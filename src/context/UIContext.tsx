'use client'
import { createContext, useContext, useState } from 'react'

interface UICtx {
  cartOpen: boolean
  openCart: () => void
  closeCart: () => void
  checkoutOpen: boolean
  openCheckout: () => void
  closeCheckout: () => void
  loyaltyOpen: boolean
  openLoyalty: () => void
  closeLoyalty: () => void
  exitOpen: boolean
  openExit: () => void
  closeExit: () => void
  consultOpen: boolean
  openConsult: () => void
  closeConsult: () => void
}

const UIContext = createContext<UICtx | null>(null)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [loyaltyOpen, setLoyaltyOpen] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [consultOpen, setConsultOpen] = useState(false)

  return (
    <UIContext.Provider value={{
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      checkoutOpen,
      openCheckout: () => { setCartOpen(false); setCheckoutOpen(true) },
      closeCheckout: () => setCheckoutOpen(false),
      loyaltyOpen,
      openLoyalty: () => setLoyaltyOpen(true),
      closeLoyalty: () => setLoyaltyOpen(false),
      exitOpen,
      openExit: () => setExitOpen(true),
      closeExit: () => setExitOpen(false),
      consultOpen,
      openConsult: () => setConsultOpen(true),
      closeConsult: () => setConsultOpen(false),
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
