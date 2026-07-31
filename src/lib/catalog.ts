import rawCatalog from '@/catalog.json'
import type { Catalog, Category, Product } from '@/types/catalog'

export const catalog = rawCatalog as unknown as Catalog

// Защита от регресса: если у двух категорий совпадёт slug, findCategory()
// найдёт только первую, а все товары второй молча станут 404 (как это уже
// было с /catalog/fakro/... — там одновременно жили "Мансардные окна Fakro"
// и "Чердачная лестница Fakro" с одинаковым slug "fakro"). Проверяем это
// один раз при старте и громко предупреждаем, если коллизия вернулась.
function warnOnDuplicateCategorySlugs(cat: Catalog) {
  const seen = new Map<string, string>()
  for (const c of cat.categories) {
    const prev = seen.get(c.slug)
    if (prev) {
      console.error(
        `[catalog] Дублирующийся slug категории "${c.slug}": "${prev}" и "${c.name}". ` +
        `Товары второй категории будут недоступны (404) — нужно задать уникальный slug.`
      )
    } else {
      seen.set(c.slug, c.name)
    }
  }
}

warnOnDuplicateCategorySlugs(catalog)

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
