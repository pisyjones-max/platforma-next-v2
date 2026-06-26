import type { MetadataRoute } from 'next'
import { getCatalog } from '@/lib/catalog'
import { SITE_URL } from '@/lib/site'
import { productSlug } from '@/lib/slug'

export default function sitemap(): MetadataRoute.Sitemap {
  const catalog = getCatalog()
  const now = new Date()

  const urls: MetadataRoute.Sitemap = [
    { url: SITE_URL,                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/delivery`,      lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/about`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/loyalty-card`,  lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  for (const groupSlug of Object.keys(catalog.groups)) {
    urls.push({ url: `${SITE_URL}/catalog/group/${groupSlug}`, changeFrequency: 'weekly', priority: 0.8 })
  }

  const seenUrls = new Set<string>()

  for (const cat of catalog.categories) {
    const catUrl = `${SITE_URL}/catalog/${cat.slug}`
    if (!seenUrls.has(catUrl)) {
      seenUrls.add(catUrl)
      urls.push({ url: catUrl, changeFrequency: 'daily', priority: 0.7, lastModified: now })
    }

    for (const p of cat.products) {
      const pid = productSlug(p.id)
      const productUrl = `${SITE_URL}/catalog/${cat.slug}/${pid}`
      if (!seenUrls.has(productUrl)) {
        seenUrls.add(productUrl)
        urls.push({ url: productUrl, changeFrequency: 'weekly', priority: 0.6 })
      }
    }
  }

  return urls
}
