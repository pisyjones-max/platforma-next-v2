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
  chatOpen: boolean
  chatPrefill: string
  chatNonce: number
  openChat: (prefill?: string) => void
  closeChat: () => void
}

const UIContext = createContext<UICtx | null>(null)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [loyaltyOpen, setLoyaltyOpen] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [consultOpen, setConsultOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatPrefill, setChatPrefill] = useState('')
  const [chatNonce, setChatNonce] = useState(0)

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
      chatOpen,
      chatPrefill,
      chatNonce,
      // prefill необязателен — используется пресетами вопросов на странице товара
      // (нажатие открывает виджет чата и подставляет готовый текст вопроса)
      openChat: (prefill?: string) => {
        setChatPrefill(prefill ?? '')
        setChatNonce(n => n + 1)
        setChatOpen(true)
      },
      closeChat: () => setChatOpen(false),
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
