import type { Catalog } from '@/types/catalog'

// Страницы вида /dostavka/[city]/[groupSlug] — коммерческие связки "район + категория товара"
// (в отличие от /dostavka/[city] — это просто инфо-страница про доставку, без цен).
// Берём НЕ все 22 группы каталога, а только те, где реально высокий коммерческий
// спрос (см. SEO_ARCHITECTURE.md) — чтобы не плодить тонкий контент по мелким группам
// вроде "Козырьки" (1 категория) ради охвата.
export const DISTRICT_COMMERCE_GROUPS = [
  'krovlya',
  'sayding',
  'fasadnye-materialy',
  'vodostoki',
  'zabory',
] as const

export type DistrictCommerceGroupSlug = typeof DISTRICT_COMMERCE_GROUPS[number]

export interface GroupCommerceMeta {
  // Короткое разговорное название для вставки в текст ("кровлю", "сайдинг")
  accusative: string
  // Единица товара для формулировок про упаковку/логистику
  unitNote: string
  // Что чаще всего спрашивают именно про эту группу при доставке — для уникального FAQ
  faqQuestion: string
  faqAnswerTpl: (cityName: string, distanceNote: string) => string
}

export const GROUP_COMMERCE_META: Record<DistrictCommerceGroupSlug, GroupCommerceMeta> = {
  krovlya: {
    accusative: 'кровельные материалы',
    unitNote: 'листами и упаковками, крупногабаритная позиция — уточняем габариты машины заранее',
    faqQuestion: 'Довезёте металлочерепицу или профлист нужной длины без порезки?',
    faqAnswerTpl: (city, dist) =>
      `Да, кровельные листы режем под ваш размер на складе перед отправкой — доставка в ${city} обычно ${dist}, длинномерные заказы уточняем отдельно, так как для них нужна другая машина.`,
  },
  sayding: {
    accusative: 'сайдинг',
    unitNote: 'упаковками, обычно помещается в стандартную газель',
    faqQuestion: 'Хватит ли одной машины на сайдинг для облицовки всего дома?',
    faqAnswerTpl: (city, dist) =>
      `Для среднего дома сайдинг с комплектующими (планки, углы, стартовые профили) обычно везём за один рейс — доставка в ${city} занимает ${dist}, при большом объёме предупредим заранее, если нужна вторая машина.`,
  },
  'fasadnye-materialy': {
    accusative: 'фасадные материалы',
    unitNote: 'плитами и упаковками, часть позиций хрупкие — везём с фиксацией',
    faqQuestion: 'Как перевозите хрупкие фасадные панели, чтобы не побились в дороге?',
    faqAnswerTpl: (city, dist) =>
      `Фасадные плиты и панели фиксируем в кузове отдельно от тяжёлых грузов — доставка в ${city} занимает ${dist}, при получении рекомендуем сразу проверить целостность упаковки.`,
  },
  vodostoki: {
    accusative: 'водосточную систему',
    unitNote: 'трубами и желобами по 3 м, длинномерный груз',
    faqQuestion: 'Довезёте водосточные трубы длиной 3 метра, не переломав их?',
    faqAnswerTpl: (city, dist) =>
      `Водостоки — длинномерный груз, возим на машине с открытым кузовом или прицепом, чтобы не сгибать трубы — доставка в ${city} занимает ${dist}.`,
  },
  zabory: {
    accusative: 'материалы для забора',
    unitNote: 'листами, столбами и крепежом — обычно один комплексный заказ',
    faqQuestion: 'Можно заказать сразу профлист, столбы и крепёж одной доставкой?',
    faqAnswerTpl: (city, dist) =>
      `Да, для забора обычно везём всё одним рейсом: полотно, столбы, лаги и крепёж — доставка в ${city} занимает ${dist}, так проще один раз согласовать разгрузку.`,
  },
}

export interface GroupPriceRange {
  min: number
  max: number
  productCount: number
}

/** Считает диапазон цен и число товаров по всем категориям группы — реальные, живые данные из catalog.json. */
export function getGroupPriceRange(catalog: Catalog, groupSlug: string): GroupPriceRange | null {
  const group = catalog.groups[groupSlug]
  if (!group) return null

  let min = Infinity
  let max = 0
  let productCount = 0

  for (const catSlug of group.categories) {
    const category = catalog.categories.find(c => c.slug === catSlug)
    if (!category) continue
    for (const product of category.products) {
      productCount++
      for (const variant of product.variants) {
        // В каталоге изредка встречаются варианты с ценой 0 (артефакт парсера —
        // товар временно без цены на mk4s.ru) — не даём им портить нижнюю границу.
        if (variant.price <= 0) continue
        if (variant.price < min) min = variant.price
        if (variant.price > max) max = variant.price
      }
    }
  }

  if (productCount === 0 || !Number.isFinite(min)) return null
  return { min, max, productCount }
}

/** Топ категорий группы по числу товаров — для блока "Что можно заказать" на странице район+категория. */
export function getGroupTopCategories(catalog: Catalog, groupSlug: string, limit = 6) {
  const group = catalog.groups[groupSlug]
  if (!group) return []
  return group.categories
    .map(slug => catalog.categories.find(c => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map(c => ({ slug: c.slug, name: c.name, productsCount: c.products.length }))
    .sort((a, b) => b.productsCount - a.productsCount)
    .slice(0, limit)
}
