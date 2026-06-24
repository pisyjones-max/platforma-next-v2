import type { Metadata } from 'next'
import { CartProvider } from '@/context/CartContext'
import { UIProvider } from '@/context/UIContext'
import { CartPanel } from '@/components/cart/CartPanel'
import { CheckoutModal } from '@/components/cart/CheckoutModal'
import { Header } from '@/components/ui/Header'
import { Footer } from '@/components/ui/Footer'
import { LoyaltyModal } from '@/components/ui/LoyaltyModal'
import { ConsultModal } from '@/components/ui/ConsultModal'
import { ExitIntentModal } from '@/components/ui/ExitIntentModal'
import { ExitIntentTrigger } from '@/components/ui/ExitIntentTrigger'
import { PromoBanner } from '@/components/ui/PromoBanner'
import './globals.css'

export const metadata: Metadata = {
  title: 'PLATFORMA — кровельные материалы',
  description: 'Кровельные материалы с доставкой по Московской области. Скидка −7%.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <CartProvider>
          <UIProvider>
            <Header />
            <main style={{ flex: 1 }}>
              {children}
            </main>
            <Footer />
            <CartPanel />
            <CheckoutModal />
            <LoyaltyModal />
            <ConsultModal />
            <ExitIntentModal />
            <ExitIntentTrigger />
            <PromoBanner />
          </UIProvider>
        </CartProvider>
      </body>
    </html>
  )
}
