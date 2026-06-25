import type { MetadataRoute } from 'next'
import { getCatalog } from '@/lib/catalog'

const BASE = 'https://platforma-next-v2.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const catalog = getCatalog()
  const urls: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/delivery`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Группы
  for (const groupSlug of Object.keys(catalog.groups)) {
    urls.push({ url: `${BASE}/catalog/group/${groupSlug}`, changeFrequency: 'weekly', priority: 0.8 })
  }

  // Категории + товары
  for (const cat of catalog.categories) {
    urls.push({ url: `${BASE}/catalog/${cat.slug}`, changeFrequency: 'daily', priority: 0.7 })
    for (const p of cat.products) {
      const pid = p.id.split('--').pop() ?? p.id
      urls.push({ url: `${BASE}/catalog/${cat.slug}/${pid}`, changeFrequency: 'weekly', priority: 0.6 })
    }
  }

  return urls
}
