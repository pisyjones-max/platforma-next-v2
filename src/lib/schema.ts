import { SITE_URL } from '@/lib/site'
import { imgUrl } from '@/lib/image'
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
      addressLocality: 'Ногинск',
      addressRegion: 'Московская область',
      addressCountry: 'RU',
    },
    areaServed: {
      '@type': 'State',
      name: 'Московская область',
    },
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

/** Product schema с ценой и наличием — база для расширенных сниппетов и Google Merchant. */
export function productSchema(product: Product, category: Category, catSlug: string, productSlug: string) {
  const v = product.variants[0]
  const price = Math.round((v?.price ?? 0) * 0.93)
  const images = (v?.images ?? []).slice(0, 4).map(img => imgUrl(img)).filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description?.trim() || `${product.title} — ${category.name}. Доставка по Московской области.`,
    sku: v?.sku,
    image: images.length ? images : undefined,
    category: category.name,
    brand: { '@type': 'Brand', name: 'PLATFORMA' },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/catalog/${catSlug}/${productSlug}`,
      priceCurrency: 'RUB',
      price: price > 0 ? price : undefined,
      availability: price > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_URL}/#organization` },
    },
  }
}

/** Утилита для безопасной вставки JSON-LD в <script> без риска инъекции. */
export function jsonLdScriptProps(data: unknown) {
  return {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, '\\u003c') },
  } as const
}
