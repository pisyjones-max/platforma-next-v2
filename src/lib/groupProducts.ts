import { getCatalog, getCanonicalCategorySlug } from '@/lib/catalog'
import type { Catalog, Product } from '@/types/catalog'

export type GroupProduct = Product & { catSlug: string }

let cache: { catalog: Catalog; map: Map<string, GroupProduct[]> } | null = null

/**
 * Все товары раздела (группы) одним списком, без дублей: один товар может лежать
 * в нескольких категориях — берём одну копию, со ссылкой на каноническую категорию.
 */
export function getGroupProducts(groupSlug: string): GroupProduct[] {
  const catalog = getCatalog()
  if (!cache || cache.catalog !== catalog) cache = { catalog, map: new Map() }
  const hit = cache.map.get(groupSlug)
  if (hit) return hit

  const group = catalog.groups[groupSlug]
  const out: GroupProduct[] = []
  if (group) {
    const seen = new Set<string>()
    for (const slug of group.categories) {
      const cat = catalog.categories.find(c => c.slug === slug)
      if (!cat) continue
      for (const p of cat.products) {
        if (seen.has(p.id)) continue
        seen.add(p.id)
        out.push({ ...p, catSlug: getCanonicalCategorySlug(catalog, p, cat.slug) })
      }
    }
  }
  cache.map.set(groupSlug, out)
  return out
}
