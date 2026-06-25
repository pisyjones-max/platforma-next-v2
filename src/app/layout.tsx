import type { Metadata } from 'next'
import Script from 'next/script'
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
  title: {
    default: 'PLATFORMA — кровельные и строительные материалы с доставкой по МО',
    template: '%s | PLATFORMA',
  },
  description:
    'Кровельные и строительные материалы оптом и в розницу. Доставка по Московской области. Скидка −7% при заказе. Звоните: +7 (933) 203-30-05. Самовывоз из Ногинска.',
  keywords: [
    'кровельные материалы',
    'строительные материалы Московская область',
    'купить кровлю',
    'гибкая черепица',
    'металлочерепица',
    'профлист',
    'утеплитель',
    'доставка кровли МО',
    'PLATFORMA',
  ],
  metadataBase: new URL('https://platforma-next-v2.vercel.app'),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'PLATFORMA',
    title: 'PLATFORMA — кровельные материалы с доставкой по МО',
    description: 'Кровельные и строительные материалы. Скидка −7%. Доставка по Московской области. Ногинск.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        {/* Яндекс.Метрика */}
        <Script id="ym-init" strategy="afterInteractive">{`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
          ym(109166481,'init',{
            ssr:true,webvisor:true,clickmap:true,
            ecommerce:'dataLayer',
            referrer:document.referrer,
            url:location.href,
            accurateTrackBounce:true,
            trackLinks:true
          });
        `}</Script>
        <noscript>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://mc.yandex.ru/watch/109166481" style={{ position: 'absolute', left: -9999 }} alt="" />
          </div>
        </noscript>
      </head>
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
