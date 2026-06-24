import rawCatalog from '@/catalog.json'
import type { Catalog, Category, Product } from '@/types/catalog'

export const catalog = rawCatalog as unknown as Catalog

export function getCatalog(): Catalog {
  return catalog
}

export function findProduct(cat: Catalog, id: string): Product | undefined {
  for (const c of cat.categories) {
    const p = c.products.find(
      p => p.id === id || p.id.split('--').pop() === id
    )
    if (p) return p
  }
}

export function findCategory(cat: Catalog, slug: string): Category | undefined {
  return cat.categories.find(c => c.slug === slug)
}

export function getParentGroup(cat: Catalog, catSlug: string) {
  const entry = Object.entries(cat.groups).find(
    ([, g]) => g.categories.includes(catSlug)
  )
  return entry ? { slug: entry[0], group: entry[1] } : null
}
