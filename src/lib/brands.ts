import type { Catalog, Product, Category } from '@/types/catalog'
import { normalizeBrand } from '@/lib/brandAliases'
import { slugify } from '@/lib/slug'

/**
 * Бренд-страницы (/catalog/brand/[slug]) агрегируют товары ОДНОГО бренда
 * со ВСЕГО каталога, независимо от категории — в отличие от фильтра по
 * бренду внутри категории (BrandFilter), который скрыт за client-side
 * состоянием и не индексируется Яндексом.
 *
 * Повод: Wordstat показывает большой прямой брендовый спрос без привязки
 * к товарной категории — "технониколь купить", "grand line официальный
 * сайт", "сайдинг деке купить" — а под него на сайте нет ни одного URL.
 * Разбивка по кластерам (см. отчёт SEO_yadro_platforma_wordstat.xlsx):
 *   Технониколь   — суммарно ~106K/мес (утеплитель, мягкая кровля, фасадная
 *                   плитка Hauberk, гидро/пароизоляция)
 *   Grand Line    — суммарно ~277K/мес (кровля, сайдинг, заборы, водостоки)
 *   Docke/Деке    — ~20K/мес по сайдингу + доп. спрос по кровле
 */

export interface BrandSeo {
  /** H1 и заголовок вкладки браузера */
  title: string
  /** <meta description> */
  description: string
  /** Короткий вступительный абзац на странице (1-2 предложения, живой текст) */
  intro: string
}

/**
 * Каноническое имя бренда (после normalizeBrand) -> ручной SEO-текст.
 * Заполнено для брендов с подтверждённым прямым спросом в Wordstat.
 * У остальных брендов используется generateFallbackSeo() ниже.
 */
const BRAND_SEO: Record<string, BrandSeo> = {
  'Технониколь': {
    title: 'Технониколь — купить в Московской области',
    description:
      'Технониколь: мягкая кровля Shinglas, утеплитель, фасадная плитка Hauberk, гидро- и пароизоляция. Цены от производителя, скидка −17%. Доставка по МО, самовывоз из Новохаритонова.',
    intro:
      'Технониколь — один из крупнейших производителей кровельных и изоляционных материалов в России. У нас в наличии гибкая черепица Shinglas, утеплители, фасадная плитка Hauberk и гидро-пароизоляционные плёнки — с доставкой по Московской области.',
  },
  'Grand Line': {
    title: 'Grand Line (Гранд Лайн) — купить в Московской области',
    description:
      'Grand Line: металлочерепица, кликфальц, сайдинг, заборы и водостоки. Официальные цены, скидка −17%. Доставка по Московской области, самовывоз из Новохаритонова.',
    intro:
      'Grand Line (Гранд Лайн) — российский производитель металлочерепицы, кровельных систем, сайдинга, заборов и водостоков. Полный ассортимент в наличии, с доставкой по Московской области.',
  },
  'Docke': {
    title: 'Docke (Деке) — купить в Московской области',
    description:
      'Docke (Деке): виниловый и фасадный сайдинг, битумная черепица, комплектующие. Цены от официального дилера, скидка −17%. Доставка по МО.',
    intro:
      'Docke (Деке) — немецкий бренд сайдинга и кровельных материалов. У нас — весь модельный ряд сайдинга Docke и сопутствующих комплектующих с доставкой по Московской области.',
  },
  'Fakro': {
    title: 'Fakro — купить в Московской области',
    description:
      'Fakro: мансардные окна, чердачные лестницы, аксессуары для мансарды. Цены от дилера, скидка −17%. Доставка по МО, самовывоз из Новохаритонова.',
    intro:
      'Fakro — польский производитель мансардных окон и чердачных лестниц №1 по узнаваемости в России. Весь ассортимент в наличии с доставкой по Московской области.',
  },
  'Katepal': {
    title: 'Katepal — купить в Московской области',
    description: 'Katepal: финская битумная черепица. Цены от дилера, скидка −17%. Доставка по Московской области.',
    intro: 'Katepal — финский производитель битумной черепицы премиум-сегмента. В наличии с доставкой по Московской области.',
  },
  'Tegola': {
    title: 'Tegola — купить в Московской области',
    description: 'Tegola: итальянская битумная черепица. Цены от дилера, скидка −17%. Доставка по Московской области.',
    intro: 'Tegola — итальянский производитель битумной черепицы. В наличии с доставкой по Московской области.',
  },
  'Ondulin': {
    title: 'Ондулин (Onduline) — купить в Московской области',
    description: 'Ондулин: битумно-целлюлозные волнистые листы для кровли. Цены от дилера, скидка −17%. Доставка по МО.',
    intro: 'Ондулин (Onduline) — лёгкая волнистая кровля из битумно-целлюлозного листа. В наличии с доставкой по Московской области.',
  },
  'ISOVER': {
    title: 'ISOVER — купить в Московской области',
    description: 'ISOVER: минераловатные утеплители для кровли, стен и перекрытий. Цены от дилера, скидка −17%. Доставка по МО.',
    intro: 'ISOVER — теплоизоляция на основе стекловолокна от Saint-Gobain. В наличии с доставкой по Московской области.',
  },
}

/** Бренды, для которых явно НЕ создаём отдельную страницу (мало товаров/нет самостоятельного спроса как бренда). */
const MIN_PRODUCTS_FOR_PAGE = 8

export interface BrandListing {
  slug: string
  name: string
  count: number
  /** Категории (slug), где встречается бренд, с числом товаров бренда в каждой */
  categories: { slug: string; name: string; count: number }[]
}

function collectBrandCounts(catalog: Catalog): Map<string, { count: number; byCategory: Map<string, number> }> {
  const map = new Map<string, { count: number; byCategory: Map<string, number> }>()
  for (const cat of catalog.categories) {
    for (const p of cat.products) {
      const brand = normalizeBrand(p.features?.['Производитель'])
      if (!brand) continue
      let entry = map.get(brand)
      if (!entry) {
        entry = { count: 0, byCategory: new Map() }
        map.set(brand, entry)
      }
      entry.count += 1
      entry.byCategory.set(cat.slug, (entry.byCategory.get(cat.slug) ?? 0) + 1)
    }
  }
  return map
}

/** Список всех брендов-страниц (с достаточным числом товаров), отсортирован по популярности. */
export function getAllBrands(catalog: Catalog): BrandListing[] {
  const counts = collectBrandCounts(catalog)
  const catBySlug = new Map(catalog.categories.map(c => [c.slug, c] as [string, Category]))

  const listings: BrandListing[] = []
  for (const [name, { count, byCategory }] of counts.entries()) {
    if (count < MIN_PRODUCTS_FOR_PAGE) continue
    const categories = Array.from(byCategory.entries())
      .map(([slug, n]) => ({ slug, name: catBySlug.get(slug)?.name ?? slug, count: n }))
      .sort((a, b) => b.count - a.count)
    listings.push({ slug: slugify(name), name, count, categories })
  }
  return listings.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ru'))
}

export function findBrandBySlug(catalog: Catalog, brandSlug: string): BrandListing | undefined {
  return getAllBrands(catalog).find(b => b.slug === brandSlug)
}

/** Все товары бренда со всего каталога, с указанием их категории. */
export function getBrandProducts(catalog: Catalog, brandName: string): { product: Product; category: Category }[] {
  const result: { product: Product; category: Category }[] = []
  for (const cat of catalog.categories) {
    for (const p of cat.products) {
      if (normalizeBrand(p.features?.['Производитель']) === brandName) {
        result.push({ product: p, category: cat })
      }
    }
  }
  return result
}

function generateFallbackSeo(name: string, count: number): BrandSeo {
  return {
    title: `${name} — купить в Московской области`,
    description: `${name}: ${count} товаров в наличии. Цены от дилера, скидка −17%. Доставка по Московской области, самовывоз из Новохаритонова.`,
    intro: `${name} — товары этого бренда в наличии на PLATFORMA, с доставкой по Московской области.`,
  }
}

export function getBrandSeo(name: string, count: number): BrandSeo {
  return BRAND_SEO[name] ?? generateFallbackSeo(name, count)
}
