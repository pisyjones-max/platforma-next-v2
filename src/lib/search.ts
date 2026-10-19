import { getCatalog, getCanonicalCategorySlug } from '@/lib/catalog'
import { productSlug } from '@/lib/slug'
import { salePrice } from '@/lib/price'
import type { Product } from '@/types/catalog'
import { normalizeBrand, type BrandFacet } from '@/lib/brandAliases'

export interface SearchResult {
  id: string
  title: string
  description?: string
  price: number
  salePrice: number
  img?: string
  sku?: string
  categorySlug: string
  categoryName: string
  href: string
  brand: string
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  /** бренды среди ВСЕХ совпадений по запросу (до фильтра по бренду) */
  facets: BrandFacet[]
}

interface IndexEntry {
  product: Product
  categorySlug: string
  categoryName: string
  titleLower: string
  haystack: string
  brand: string
}

// Индекс строится один раз за время жизни серверного процесса (ленивая
// инициализация при первом запросе) и переиспользуется во всех последующих
// запросах на том же инстансе — не нужно на каждый чих сканировать и лишний
// раз лоуеркейсить ~6000 товаров.
let cachedIndex: IndexEntry[] | null = null

function buildIndex(): IndexEntry[] {
  const catalog = getCatalog()
  const index: IndexEntry[] = []
  for (const cat of catalog.categories) {
    for (const p of cat.products) {
      // Один товар лежит сразу в нескольких категориях — в поиск пускаем
      // только одну копию, из канонической категории (без дублей карточек).
      if (getCanonicalCategorySlug(catalog, p, cat.slug) !== cat.slug) continue
      const featuresBlob = p.features ? Object.values(p.features).join(' ') : ''
      const titleLower = p.title.toLowerCase()
      const haystack = `${titleLower} ${(p.description ?? '').toLowerCase()} ${featuresBlob.toLowerCase()}`
      index.push({
        product: p,
        categorySlug: cat.slug,
        categoryName: cat.name,
        titleLower,
        haystack,
        brand: normalizeBrand(p.features?.['Производитель']),
      })
    }
  }
  return index
}

function getIndex(): IndexEntry[] {
  if (!cachedIndex) cachedIndex = buildIndex()
  return cachedIndex
}

function toResult(entry: IndexEntry): SearchResult {
  const p = entry.product
  const v = p.variants?.[0]
  const price = v?.price ?? 0
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price,
    salePrice: salePrice(price),
    img: v?.images?.[0],
    sku: v?.sku,
    categorySlug: entry.categorySlug,
    categoryName: entry.categoryName,
    href: `/catalog/${entry.categorySlug}/${productSlug(p.id)}`,
    brand: entry.brand,
  }
}

/**
 * Поиск по всему каталогу (все категории, ~6000+ товаров).
 * Работает на сервере (API-роут либо серверный компонент страницы /search) —
 * клиенту весь каталог не отдаётся, только уже отфильтрованный и
 * ограниченный по количеству результат.
 *
 * Логика: товар подходит, если КАЖДОЕ слово запроса встречается хоть где-то
 * в title/description/features (AND по токенам). Ранжирование — по тому,
 * сколько слов совпало в заголовке и насколько близко к началу.
 */
export function searchProducts(query: string, limit = 60, brands: string[] = []): SearchResponse {
  const q = query.trim().toLowerCase()
  if (!q) return { results: [], total: 0, facets: [] }

  const tokens = q.split(/\s+/).filter(t => t.length > 0)
  if (tokens.length === 0) return { results: [], total: 0, facets: [] }

  const index = getIndex()
  const scored: { entry: IndexEntry; score: number }[] = []

  for (const entry of index) {
    let matchedAll = true
    let score = 0
    for (const t of tokens) {
      const inTitle = entry.titleLower.includes(t)
      const inHaystack = inTitle || entry.haystack.includes(t)
      if (!inHaystack) { matchedAll = false; break }
      if (inTitle) {
        score += entry.titleLower.startsWith(t) ? 5 : 3
      } else {
        score += 1
      }
    }
    if (matchedAll) scored.push({ entry, score })
  }

  // Счётчики брендов — по всем совпадениям запроса, чтобы плашки не пропадали после выбора
  const counts = new Map<string, number>()
  for (const { entry } of scored) {
    if (!entry.brand) continue
    counts.set(entry.brand, (counts.get(entry.brand) ?? 0) + 1)
  }
  const facets: BrandFacet[] = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ru'))

  const selected = new Set(brands)
  const filtered = selected.size > 0 ? scored.filter(s => selected.has(s.entry.brand)) : scored

  filtered.sort((a, b) => b.score - a.score || a.entry.titleLower.localeCompare(b.entry.titleLower, 'ru'))

  return {
    total: filtered.length,
    results: filtered.slice(0, limit).map(s => toResult(s.entry)),
    facets,
  }
}
