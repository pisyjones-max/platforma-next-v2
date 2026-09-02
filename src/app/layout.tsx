import { SITE_URL } from '@/lib/site'
import { organizationSchema, websiteSchema, jsonLdScriptProps } from '@/lib/schema'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Unbounded, Geologica } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'
import { UIProvider } from '@/context/UIContext'
import { CardProvider } from '@/context/CardContext'
import { CartPanel } from '@/components/cart/CartPanel'
import { CheckoutModal } from '@/components/cart/CheckoutModal'
import { Header } from '@/components/ui/Header'
import { Footer } from '@/components/ui/Footer'
import { LoyaltyModal } from '@/components/ui/LoyaltyModal'
import { ConsultModal } from '@/components/ui/ConsultModal'
import { ExitIntentModal } from '@/components/ui/ExitIntentModal'
import { ExitIntentTrigger } from '@/components/ui/ExitIntentTrigger'
import { PromoBanner } from '@/components/ui/PromoBanner'
import { PromosBanner } from '@/components/ui/PromosBanner'
import { TelegramChat } from '@/components/ui/TelegramChat'
import './globals.css'

// Раньше шрифты подключались через @import url("https://fonts.googleapis.com/...")
// в globals.css — это render-blocking запрос: браузер должен скачать CSS,
// распарсить @import, сходить на fonts.googleapis.com, получить оттуда ещё
// один CSS, и только потом скачать сами файлы шрифтов с fonts.gstatic.com.
// На медленном 4G (как в тесте PageSpeed) это добавляет несколько round-trip'ов
// ещё до первой отрисовки текста — отсюда красные FCP/LCP.
// next/font/google скачивает шрифты на этапе сборки и раздаёт их с того же
// домена, что и сайт: внешних запросов к Google больше нет вообще.
//
// Unbounded и Geologica — вариативные шрифты, но у Geologica ПОМИМО насыщенности
// (wght) есть ещё 3 неиспользуемые оси: наклон (slnt), курсив (CRSV) и резкость
// (SHRP). Полный вариативный файл тянет вес всех этих осей разом, из-за чего он
// получается тяжелее по байтам, чем три отдельных файла с конкретными
// начертаниями — на практике это и просадило LCP (4,9с вместо 3,7с), несмотря
// на то что запросов стало меньше (5 -> 2). На медленном 4G размер файла важнее
// количества round-trip'ов. Поэтому явно перечисляем только те начертания,
// которые реально используются на сайте.
const unbounded = Unbounded({
  subsets: ['cyrillic', 'latin'],
  weight: ['700', '800'],
  display: 'swap',
  variable: '--font-unbounded',
})

const geologica = Geologica({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-geologica',
})

export const metadata: Metadata = {
  title: {
    default: 'PLATFORMA — кровельные и строительные материалы с доставкой по МО',
    template: '%s | PLATFORMA',
  },
  description:
    'Кровельные и строительные материалы оптом и в розницу. Доставка по Московской области. Звоните: +7 (933) 203-30-05. Самовывоз из Новохаритонова.',
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
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'PLATFORMA',
    title: 'PLATFORMA — кровельные материалы с доставкой по МО',
    description: 'Кровельные и строительные материалы. Доставка по Московской области. Новохаритоново.',
    images: [{ url: '/img/og-cover.webp', width: 1200, height: 630, alt: 'PLATFORMA — кровельные материалы' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PLATFORMA — кровельные материалы с доставкой по МО',
    description: 'Кровельные и строительные материалы. Доставка по Московской области.',
    images: ['/img/og-cover.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${unbounded.variable} ${geologica.variable}`}>
      <head>
        {/* Schema.org: Organization + WebSite */}
        <script {...jsonLdScriptProps(organizationSchema())} />
        <script {...jsonLdScriptProps(websiteSchema())} />

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
            <CardProvider>
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
            <PromosBanner />
            <TelegramChat />
            </CardProvider>
          </UIProvider>
        </CartProvider>
      </body>
    </html>
  )
}
