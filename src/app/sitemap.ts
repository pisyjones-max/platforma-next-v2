import type { MetadataRoute } from 'next'
import { getCatalog } from '@/lib/catalog'
import { SITE_URL } from '@/lib/site'
import { productSlug } from '@/lib/slug'
import { CITIES } from '@/lib/cities'
import { getAllArticles } from '@/lib/blog'
import { getAllBrands } from '@/lib/brands'
import { DISTRICT_COMMERCE_GROUPS } from '@/lib/districtCommerce'
import { SERVICES } from '@/lib/services'

// См. комментарий в src/lib/catalog.ts — каталог читается с диска в рантайме,
// эта настройка даёт sitemap.xml подхватывать новые товары раз в 10 минут
// без пересборки и рестарта сайта.
export const revalidate = 600

export default function sitemap(): MetadataRoute.Sitemap {
  const catalog = getCatalog()
  const now = new Date()

  const urls: MetadataRoute.Sitemap = [
    { url: SITE_URL,                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/delivery`,      lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/about`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/loyalty-card`,  lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/dizayn-proekt`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fasad/fasad-doma`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/fasad/sajding`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
  ]

  for (const service of SERVICES) {
    urls.push({ url: `${SITE_URL}${service.urlPath}`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 })
  }

  for (const city of CITIES) {
    urls.push({ url: `${SITE_URL}/dostavka/${city.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 })
    for (const groupSlug of DISTRICT_COMMERCE_GROUPS) {
      if (!catalog.groups[groupSlug]) continue
      urls.push({
        url: `${SITE_URL}/dostavka/${city.slug}/${groupSlug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.75,
      })
    }
  }

  urls.push({ url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 })
  for (const article of getAllArticles()) {
    urls.push({
      url: `${SITE_URL}/blog/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  for (const groupSlug of Object.keys(catalog.groups)) {
    urls.push({ url: `${SITE_URL}/catalog/group/${groupSlug}`, changeFrequency: 'weekly', priority: 0.8 })
  }

  urls.push({ url: `${SITE_URL}/catalog/brand`, changeFrequency: 'weekly', priority: 0.7, lastModified: now })
  for (const brand of getAllBrands(catalog)) {
    urls.push({ url: `${SITE_URL}/catalog/brand/${brand.slug}`, changeFrequency: 'weekly', priority: 0.75, lastModified: now })
  }

  const seenUrls = new Set<string>()

  for (const cat of catalog.categories) {
    // Пустые категории (0 товаров) не индексируем — thin content, риск для
    // остального сайта в глазах Яндекса/Google. См. CategoryPage generateMetadata:
    // такие страницы дополнительно получают noindex. Как только категория
    // наполнится товарами, она сама появится здесь на следующей ревалидации.
    if (cat.products.length === 0) continue

    const catUrl = `${SITE_URL}/catalog/${cat.slug}`
    if (!seenUrls.has(catUrl)) {
      seenUrls.add(catUrl)
      urls.push({ url: catUrl, changeFrequency: 'daily', priority: 0.7, lastModified: now })
    }

    for (const p of cat.products) {
      // Без variants страница товара отдаёт notFound() (см. product page.tsx) —
      // такую запись нельзя пускать в sitemap, иначе это гарантированный 404
      // по ссылке из sitemap.xml вместо честных 200 OK.
      if (!p.variants?.length) continue

      const pid = productSlug(p.id)
      const productUrl = `${SITE_URL}/catalog/${cat.slug}/${pid}`
      if (!seenUrls.has(productUrl)) {
        seenUrls.add(productUrl)
        urls.push({ url: productUrl, changeFrequency: 'weekly', priority: 0.6, lastModified: now })
      }
    }
  }

  return urls
}
