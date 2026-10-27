import { getCatalog, getCanonicalCategorySlug, getParentGroup } from '@/lib/catalog'
import { productSlug } from '@/lib/slug'
import { salePrice } from '@/lib/price'
import type { Product } from '@/types/catalog'
import { normalizeBrand, type BrandFacet } from '@/lib/brandAliases'
import { fold, stemRaw, layoutSwap, translit, hasLatin, hasCyrillic, buildVocab, nearWords, SYNONYMS, type Vocab } from '@/lib/searchFuzzy'

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
  /** точных совпадений нет — показаны похожие (опечатки, раскладка, синонимы) */
  approximate: boolean
}

interface IndexEntry {
  product: Product
  categorySlug: string
  categoryName: string
  titleLower: string
  haystack: string
  /** то же самое после фонетической свёртки (для поиска с опечатками) */
  haystackFolded: string
  titleFolded: string
  brand: string
}

// Индекс строится один раз за время жизни серверного процесса (ленивая
// инициализация при первом запросе) и переиспользуется во всех последующих
// запросах на том же инстансе — не нужно на каждый чих сканировать и лишний
// раз лоуеркейсить ~6000 товаров.
let cachedIndex: IndexEntry[] | null = null
let cachedVocab: Vocab | null = null

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
      // Название категории и группы тоже ищем: «террасная доска» → товары ДПК,
      // даже если в названии самого товара этих слов нет.
      const groupName = getParentGroup(catalog, cat.slug)?.group.name ?? ''
      const haystack = `${titleLower} ${cat.name.toLowerCase()} ${groupName.toLowerCase()} ${(p.description ?? '').toLowerCase()} ${featuresBlob.toLowerCase()}`
      index.push({
        product: p,
        categorySlug: cat.slug,
        categoryName: cat.name,
        titleLower,
        haystack,
        haystackFolded: fold(haystack),
        titleFolded: fold(titleLower),
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

// Словарь слов из названий и категорий — для исправления опечаток
function getVocab(): Vocab {
  if (!cachedVocab) cachedVocab = buildVocab(getIndex().map(e => `${e.titleFolded} ${fold(e.categoryName)}`))
  return cachedVocab
}

// Запасные варианты одного слова запроса (после свёртки): основа без окончания,
// синонимы, исправленная раскладка / транслит, похожие слова из каталога.
function fuzzyAlternatives(token: string, vocab: Vocab): string[] {
  const forms = new Set<string>()
  const variants = [token]
  if (hasLatin(token) && !hasCyrillic(token)) variants.push(layoutSwap(token), translit(token))
  for (const v of variants) {
    const base = fold(stemRaw(v))
    if (base.length >= 2) forms.add(base)
    const syn = SYNONYMS.get(fold(v))
    if (syn) syn.forEach(x => forms.add(x))
    for (const w of nearWords(base, vocab)) forms.add(w)
  }
  return Array.from(forms)
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
  if (!q) return { results: [], total: 0, facets: [], approximate: false }

  const tokens = q.split(/\s+/).filter(t => t.length > 0)
  if (tokens.length === 0) return { results: [], total: 0, facets: [], approximate: false }

  const index = getIndex()
  const vocab = getVocab()
  // для каждого слова запроса готовим запасные варианты один раз, а не на каждый товар
  const alts = tokens.map(t => fuzzyAlternatives(t, vocab))
  const synForms = tokens.map(t => SYNONYMS.get(fold(t)) ?? [])
  const scored: { entry: IndexEntry; score: number; exact: boolean }[] = []

  for (const entry of index) {
    let matchedAll = true
    let exact = true
    let score = 0
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      const inTitle = entry.titleLower.includes(t)
      const inHaystack = inTitle || entry.haystack.includes(t)
      // бытовой синоним в названии («профлист» → профнастил) — сильный сигнал
      if (synForms[i].length > 0 && synForms[i].some(f => entry.titleFolded.includes(f))) score += 4
      if (inHaystack) {
        score += inTitle ? (entry.titleLower.startsWith(t) ? 5 : 3) : 1
        continue
      }
      // точного вхождения нет — пробуем похожие варианты (ранжируются ниже точных)
      exact = false
      let best = 0
      for (const a of alts[i]) {
        if (entry.titleFolded.includes(a)) { best = Math.max(best, entry.titleFolded.startsWith(a) ? 3 : 2); if (best === 3) break; continue }
        if (best < 0.5 && entry.haystackFolded.includes(a)) best = 0.5
      }
      if (best === 0) { matchedAll = false; break }
      score += best
    }
    if (matchedAll) scored.push({ entry, score, exact })
  }

    const hasExact = scored.some(s => s.exact)

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
    approximate: !hasExact && scored.length > 0,
  }
}
