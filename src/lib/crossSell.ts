import type { Catalog, Category, Product } from '@/types/catalog'

/**
 * Правила блока "С этим товаром покупают".
 *
 * Работаем на уровне ГРУПП/КАТЕГОРИЙ, а не отдельных товаров — состав каталога
 * меняется каждую ночь от парсера, а правила должны жить долго.
 *
 * ВАЖНО: slug категории не уникален глобально (например "fakro" встречается
 * и в mansardnye-okna, и в cherdachnye-lestnitsy — см. getCategoryInGroup).
 * Поэтому таргет всегда указывается как (group, category?), а не просто как
 * строка-слаг.
 *
 * - { group } — взять товары из ВСЕХ категорий этой группы
 * - { group, category } — взять товары только из одной конкретной категории
 *
 * Правишь руками: просто добавляешь/убираешь строчки, компонент трогать не надо.
 * Если для группы товара правило не задано — блок на странице просто не показывается.
 */
export interface CrossSellTarget {
  group: string
  category?: string
}

export const CROSS_SELL_RULES: Record<string, CrossSellTarget[]> = {
  krovlya: [
    { group: 'izolyatsiya' },
    { group: 'krepezh' },
    { group: 'snegozaderzhateli' },
    { group: 'ventilyatsiya-krovli' },
    { group: 'vodostoki' },
  ],
  sayding: [
    { group: 'sayding', category: 'obreshetka' },
    { group: 'sayding', category: 'sofity' },
    { group: 'krepezh' },
    { group: 'vodostoki' },
  ],
  'fasadnye-materialy': [
    { group: 'izolyatsiya' },
    { group: 'krepezh' },
    { group: 'sayding', category: 'sofity' },
    { group: 'himiya' },
  ],
  vodostoki: [
    { group: 'krovlya' },
    { group: 'drenazh' },
    { group: 'krepezh' },
  ],
  drenazh: [
    { group: 'vodostoki' },
    { group: 'blagoustroystvo' },
  ],
  'terrasnaya-doska-dpk': [
    { group: 'krepezh' },
    { group: 'himiya' },
    { group: 'blagoustroystvo' },
  ],
  izolyatsiya: [
    { group: 'krovlya' },
    { group: 'sayding' },
    { group: 'krepezh' },
  ],
  'mansardnye-okna': [
    { group: 'cherdachnye-lestnitsy' },
    { group: 'mansardnye-okna', category: 'shtory' },
    { group: 'mansardnye-okna', category: 'izolyatsionnye-oklady' },
    { group: 'kozyrek-iz-polikarbonata' },
  ],
  'cherdachnye-lestnitsy': [
    { group: 'mansardnye-okna' },
    { group: 'izolyatsiya' },
  ],
  'ventilyatsiya-krovli': [
    { group: 'krovlya' },
    { group: 'snegozaderzhateli' },
  ],
  krovli: [
    { group: 'krovlya' },
    { group: 'dymohody' },
  ],
  'drevesno-plitnye-materialy': [
    { group: 'himiya' },
    { group: 'krepezh' },
  ],
  snegozaderzhateli: [
    { group: 'krovlya' },
    { group: 'krepezh' },
    { group: 'bezopasnost-krovli' },
  ],
  'bezopasnost-krovli': [
    { group: 'krovlya' },
    { group: 'snegozaderzhateli' },
  ],
  zabory: [
    { group: 'krepezh' },
    { group: 'himiya' },
    { group: 'blagoustroystvo' },
  ],
  krepezh: [
    { group: 'krovlya' },
    { group: 'sayding' },
  ],
  dymohody: [
    { group: 'krovlya' },
    { group: 'krovli' },
  ],
  himiya: [
    { group: 'terrasnaya-doska-dpk' },
    { group: 'zabory' },
    { group: 'drevesno-plitnye-materialy' },
  ],
  floor: [
    { group: 'drevesno-plitnye-materialy' },
    { group: 'himiya' },
  ],
  'kozyrek-iz-polikarbonata': [
    { group: 'mansardnye-okna' },
    { group: 'krepezh' },
  ],
  blagoustroystvo: [
    { group: 'zabory' },
    { group: 'terrasnaya-doska-dpk' },
  ],
  'suhie-smesi': [
    { group: 'himiya' },
    { group: 'drevesno-plitnye-materialy' },
  ],
}

/** Товар с сохранённой информацией о категории (нужна для ссылки /catalog/[slug]/[id]) */
export interface CrossSellProduct extends Product {
  catSlug: string
  catName: string
}

/**
 * Определяет "настоящую" группу категории по префиксу id её товаров
 * (например "krovlya--myagkaya-krovlya--...") — это надёжнее, чем сверяться
 * со списком groups[].categories, т.к. slug категории не уникален и одна и та же
 * строка-слаг встречается в разных группах как отдельные объекты Category.
 */
function categoryGroupSlug(cat: Category): string | undefined {
  const sampleId = cat.products[0]?.id
  return sampleId?.split('--')[0]
}

/** Все категории, реально принадлежащие группе groupSlug */
function getCategoriesForGroup(catalog: Catalog, groupSlug: string): Category[] {
  return catalog.categories.filter(c => categoryGroupSlug(c) === groupSlug)
}

/** Конкретная категория внутри конкретной группы (разрешает неуникальность slug) */
function getCategoryInGroup(catalog: Catalog, groupSlug: string, categorySlug: string): Category | undefined {
  return catalog.categories.find(c => c.slug === categorySlug && categoryGroupSlug(c) === groupSlug)
}

/** Простой детерминированный PRNG (mulberry32) — чтобы подборка не прыгала
 *  при каждом рендере одной и той же страницы, но менялась день ото дня. */
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

/**
 * Подбирает товары для блока "С этим товаром покупают" на основе группы
 * текущего товара. Возвращает [] если правило для группы не задано или
 * подходящих товаров не нашлось — в этом случае блок просто не рендерится.
 */
export function getCrossSellProducts(
  catalog: Catalog,
  groupSlug: string,
  currentProductId: string,
  limit = 8,
): CrossSellProduct[] {
  const targets = CROSS_SELL_RULES[groupSlug]
  if (!targets || targets.length === 0) return []

  const pool: CrossSellProduct[] = []
  const seenIds = new Set<string>()

  for (const t of targets) {
    if (!catalog.groups[t.group]) continue
    const cats = t.category
      ? [getCategoryInGroup(catalog, t.group, t.category)].filter((c): c is Category => !!c)
      : getCategoriesForGroup(catalog, t.group)

    for (const cat of cats) {
      for (const p of cat.products) {
        if (p.id === currentProductId || seenIds.has(p.id)) continue
        seenIds.add(p.id)
        pool.push({ ...p, catSlug: cat.slug, catName: cat.name })
      }
    }
  }

  if (pool.length === 0) return []

  // День меняет seed -> подборка обновляется раз в сутки, но не скачет
  // на каждый рендер одной и той же страницы. Товар меняет seed -> разные
  // товары получают разные наборы рекомендаций.
  const day = new Date().toISOString().slice(0, 10)
  const rand = mulberry32(hashStr(currentProductId + day))

  const scored = pool.map(p => {
    const hasPhoto = (p.variants[0]?.images?.length ?? 0) > 0
    const hasFeatures = Object.keys(p.features ?? {}).length > 0
    return { p, score: (hasPhoto ? 1 : 0) + (hasFeatures ? 1 : 0) + rand() }
  })
  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map(s => s.p)
}
