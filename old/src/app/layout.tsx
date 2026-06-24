import type { Metadata } from 'next'
import { CartProvider } from '@/context/CartContext'
import { UIProvider } from '@/context/UIContext'
import { CartPanel } from '@/components/cart/CartPanel'
import { CheckoutModal } from '@/components/cart/CheckoutModal'
import './globals.css'

export const metadata: Metadata = {
  title: 'PLATFORMA — кровельные материалы',
  description: 'Кровельные материалы с доставкой по Московской области. Цены на 7% ниже рынка.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <CartProvider>
          <UIProvider>
            {children}
            <CartPanel />
            <CheckoutModal />
          </UIProvider>
        </CartProvider>
      </body>
    </html>
  )
}
