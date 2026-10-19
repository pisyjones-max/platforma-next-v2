import { getCatalog, getCanonicalCategorySlug } from '@/lib/catalog'
import { productSlug } from '@/lib/slug'
import { SITE_URL } from '@/lib/site'

// SKU варианта → путь к карточке товара. Строится на сервере из каталога,
// чтобы клиент не мог подсунуть в Telegram левую ссылку.
let cache: { catalog: unknown; map: Map<string, string> } | null = null

function getMap(): Map<string, string> {
  const catalog = getCatalog()
  if (cache && cache.catalog === catalog) return cache.map
  const map = new Map<string, string>()
  for (const cat of catalog.categories) {
    for (const p of cat.products) {
      const slug = getCanonicalCategorySlug(catalog, p, cat.slug)
      const path = `/catalog/${slug}/${productSlug(p.id)}`
      if (!map.has(p.id)) map.set(p.id, path) // на случай, если в корзину попал id вместо sku
      for (const v of p.variants ?? []) {
        if (v.sku && !map.has(v.sku)) map.set(v.sku, path)
      }
    }
  }
  cache = { catalog, map }
  return map
}

/** Путь к карточке товара по SKU (или id) или null, если товар не найден. */
export function productPathBySku(sku: string): string | null {
  try {
    return getMap().get(sku) ?? null
  } catch {
    return null
  }
}

/** Полная ссылка на товар по SKU или null, если товар не найден. */
export function productUrlBySku(sku: string): string | null {
  const path = productPathBySku(sku)
  return path ? `${SITE_URL}${path}` : null
}
