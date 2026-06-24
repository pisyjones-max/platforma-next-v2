import type { Metadata } from 'next'
import { CartProvider } from '@/context/CartContext'
import { UIProvider } from '@/context/UIContext'
import { CartPanel } from '@/components/cart/CartPanel'
import { CheckoutModal } from '@/components/cart/CheckoutModal'
import { Header } from '@/components/ui/Header'
import { Footer } from '@/components/ui/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'PLATFORMA — кровельные материалы',
  description: 'Кровельные материалы с доставкой по Московской области. Скидка −7%.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <CartProvider>
          <UIProvider>
            <Header />
            {children}
            <Footer />
            <CartPanel />
            <CheckoutModal />
          </UIProvider>
        </CartProvider>
      </body>
    </html>
  )
}
