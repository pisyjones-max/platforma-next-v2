import { SITE_URL } from '@/lib/site'
import { imgUrl } from '@/lib/image'
import { SALE_RATE } from '@/lib/constants'
import { normalizeBrand } from '@/lib/brandAliases'
import type { Product, Category } from '@/types/catalog'

/**
 * Organization / LocalBusiness — размещается один раз глобально (layout.tsx).
 * Помогает Google понять, кто владелец сайта, показывать телефон/адрес в панели знаний.
 */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HardwareStore',
    '@id': `${SITE_URL}/#organization`,
    name: 'PLATFORMA',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    image: `${SITE_URL}/icon.png`,
    telephone: '+7-933-203-30-05',
    priceRange: '₽₽',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'д. 220, лит. 1Б',
      addressLocality: 'Новохаритоново',
      addressRegion: 'Московская область',
      addressCountry: 'RU',
    },
    areaServed: [
      { '@type': 'City', name: 'Раменское' },
      { '@type': 'City', name: 'Новохаритоново' },
      { '@type': 'City', name: 'Гжель' },
      { '@type': 'City', name: 'Воскресенск' },
      { '@type': 'City', name: 'Бронницы' },
      { '@type': 'City', name: 'Жуковский' },
      { '@type': 'State', name: 'Московская область' },
    ],
    sameAs: [
      'https://t.me/platforma_roof',
    ],
  }
}

/** WebSite schema с потенциальным sitelinks search box (главная страница). */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'PLATFORMA',
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

/** Хлебные крошки — нужны почти на всех внутренних страницах. */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  }
}

/**
 * Product schema с ценой и наличием — база для расширенных сниппетов и Google Merchant.
 *
 * ВАЖНО: aggregateRating добавляется в объект ТОЛЬКО если у товара реально
 * есть отзывы (reviewCount > 0). Google Search Console помечает ошибкой
 * "Missing field aggregateRating" карточки, где это поле присутствует, но
 * пустое/нулевое — поэтому поле либо есть целиком и с реальными цифрами,
 * либо отсутствует в JSON-LD вовсе.
 */
export function productSchema(product: Product, category: Category, catSlug: string, productSlug: string) {
  const v = product.variants[0]
  const price = Math.round((v?.price ?? 0) * SALE_RATE)
  const images = (v?.images ?? []).slice(0, 4).map(img => imgUrl(img)).filter(Boolean)
  const brandName = normalizeBrand(product.features?.['Производитель']) || 'PLATFORMA'

  const hasReviews = typeof product.reviewCount === 'number' && product.reviewCount > 0
    && typeof product.rating === 'number' && product.rating > 0

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description?.trim() || `${product.title} — ${category.name}. Доставка по Московской области.`,
    sku: v?.sku,
    image: images.length ? images : undefined,
    category: category.name,
    brand: { '@type': 'Brand', name: brandName },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/catalog/${catSlug}/${productSlug}`,
      priceCurrency: 'RUB',
      price: price > 0 ? price : undefined,
      availability: price > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_URL}/#organization` },
    },
    ...(hasReviews ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  }
}

/** FAQPage — только для реально отображаемого на странице FAQ (см. src/lib/faq.ts). */
export function faqSchema(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
}

/** Утилита для безопасной вставки JSON-LD в <script> без риска инъекции. */
export function jsonLdScriptProps(data: unknown) {
  return {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, '\\u003c') },
  } as const
}
