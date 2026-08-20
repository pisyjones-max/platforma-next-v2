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
  /**
   * Расширенный абзац "о бренде" — история, репутация, чем известен.
   * Заполнен только для брендов с подтверждённым прямым спросом (см. ниже);
   * без него на странице показывается только intro + автоматические факты
   * из данных каталога (страна, гарантия — см. getBrandStats()).
   */
  about?: string
}

/**
 * Данные о гарантии и стране производства для каждого бренда РЕАЛЬНО ЕСТЬ
 * в catalog.json — features['Страна производства'] и features['Гарантия, лет']
 * заполняются парсером для большинства товаров (см. getBrandStats() ниже).
 * Ручной текст здесь — это только "человеческая" история/репутация бренда
 * (нашли через веб-поиск, проверено на официальных сайтах производителей
 * и авторизованных дилеров в августе 2026), а не источник цифр гарантии —
 * цифры гарантии на странице бренда ВСЕГДА берутся из данных каталога, а
 * не из этого текста, чтобы не разойтись с тем, что видит покупатель на
 * карточках конкретных товаров.
 */
const BRAND_SEO: Record<string, BrandSeo> = {
  'Технониколь': {
    title: 'Технониколь — купить в Московской области',
    description:
      'Технониколь: мягкая кровля Shinglas, утеплитель, фасадная плитка Hauberk, гидро- и пароизоляция. Цены от производителя, скидка −17%. Доставка по МО, самовывоз из Новохаритонова.',
    intro:
      'Технониколь — один из крупнейших производителей кровельных и изоляционных материалов в России. У нас в наличии гибкая черепица Shinglas, утеплители, фасадная плитка Hauberk и гидро-пароизоляционные плёнки — с доставкой по Московской области.',
    about:
      'Технониколь — российская компания, один из крупнейших в мире производителей кровельных, гидро- и теплоизоляционных материалов, с заводами в России, Беларуси и других странах. Гибкая черепица Shinglas выпускается по ГОСТ 32806-2014, а часть продукции сертифицирована по международному стандарту EN 544 для поставок в Европу. У производителя есть собственная онлайн-система оформления гарантии и рекламаций на сайте shinglas.ru.',
  },
  'Grand Line': {
    title: 'Grand Line (Гранд Лайн) — купить в Московской области',
    description:
      'Grand Line: металлочерепица, кликфальц, сайдинг, заборы и водостоки. Официальные цены, скидка −17%. Доставка по Московской области, самовывоз из Новохаритонова.',
    intro:
      'Grand Line (Гранд Лайн) — российский производитель металлочерепицы, кровельных систем, сайдинга, заборов и водостоков. Полный ассортимент в наличии, с доставкой по Московской области.',
    about:
      'Grand Line — российский производственный концерн полного цикла: собственная прокатка стали, нанесение полимерных покрытий и профилирование металлочерепицы, профнастила и сайдинга на площадках в разных регионах России. Компания выдаёт письменную гарантию на продукцию и известна широкой линейкой доборных элементов и фасонных изделий под каждую коллекцию — не приходится подбирать комплектующие у сторонних поставщиков.',
  },
  'Docke': {
    title: 'Docke (Деке) — купить в Московской области',
    description:
      'Docke (Деке): виниловый и фасадный сайдинг, битумная черепица, комплектующие. Цены от официального дилера, скидка −17%. Доставка по МО.',
    intro:
      'Docke (Деке) — бренд сайдинга и кровельных материалов с российским производством. У нас — весь модельный ряд сайдинга Docke и сопутствующих комплектующих с доставкой по Московской области.',
    about:
      'Docke (Дёке) вышел на рынок в 2005 году и производит виниловый сайдинг, фасадные панели, водостоки и гибкую черепицу на собственном заводе в Дмитрове (Московская область) — то есть материал не пересекает границу и не облагается таможенными пошлинами, что и держит цену ниже импортных аналогов при сопоставимом качестве. В 2013 году на производстве внедрили технологию ZEITech, после чего гарантия на отсутствие деформаций у части коллекций выросла до 50 лет.',
  },
  'Fakro': {
    title: 'Fakro — купить в Московской области',
    description:
      'Fakro: мансардные окна, чердачные лестницы, аксессуары для мансарды. Цены от дилера, скидка −17%. Доставка по МО, самовывоз из Новохаритонова.',
    intro:
      'Fakro — польский производитель мансардных окон и чердачных лестниц №1 по узнаваемости в России. Весь ассортимент в наличии с доставкой по Московской области.',
    about:
      'Fakro основан в 1991 году в городе Новы-Сонч (Польша) как семейное предприятие и вырос в мирового производителя мансардных окон и чердачных лестниц с заводами в Польше, Китае и России. На стеклопакет и большинство запчастей к окнам действует бессрочная гарантия производителя — она подтверждается металлическим шильдом с заводским номером на торце каждого окна.',
  },
  'Katepal': {
    title: 'Katepal — купить в Московской области',
    description: 'Katepal: финская битумная черепица. Цены от дилера, скидка −17%. Доставка по Московской области.',
    intro: 'Katepal — финский производитель битумной черепицы премиум-сегмента. В наличии с доставкой по Московской области.',
    about:
      'Katepal Oy — финский завод в городе Лемпяяля под Хельсинки, выпускающий битумную черепицу с 1949 года на основе СБС-модифицированного битума собственной разработки. Один из старейших производителей гибкой черепицы в Европе — на российском рынке представлен более 25 лет.',
  },
  'Tegola': {
    title: 'Tegola — купить в Московской области',
    description: 'Tegola: итальянская битумная черепица. Цены от дилера, скидка −17%. Доставка по Московской области.',
    intro: 'Tegola — итальянский производитель битумной черепицы. В наличии с доставкой по Московской области.',
    about:
      'Tegola (корпорация TEGOLA) — итальянский производитель кровельных, гидроизоляционных и геосинтетических материалов, поставляющий продукцию для промышленного и гражданского строительства по всему миру. Часть коллекций для российского рынка выпускается на локальной производственной площадке.',
  },
  'Ondulin': {
    title: 'Ондулин (Onduline) — купить в Московской области',
    description: 'Ондулин: битумно-целлюлозные волнистые листы для кровли. Цены от дилера, скидка −17%. Доставка по МО.',
    intro: 'Ондулин (Onduline) — лёгкая волнистая кровля из битумно-целлюлозного листа. В наличии с доставкой по Московской области.',
    about:
      'Ондулин выпускается французской компанией Onduline SA, основанной в 1944 году, — она изобрела и запатентовала сам тип волнистого битумно-целлюлозного кровельного листа, который со временем стал нарицательным названием для этой категории материалов. Оригинальный ондулин отличают тиснёная маркировка ONDULINE на поверхности листа и код партии сбоку — так на месте можно проверить подлинность материала.',
  },
  'ISOVER': {
    title: 'ISOVER — купить в Московской области',
    description: 'ISOVER: минераловатные утеплители для кровли, стен и перекрытий. Цены от дилера, скидка −17%. Доставка по МО.',
    intro: 'ISOVER — теплоизоляция на основе стекловолокна от Saint-Gobain. В наличии с доставкой по Московской области.',
    about:
      'ISOVER принадлежит французской промышленной группе Saint-Gobain (основана в 1665 году) — бренд теплоизоляции существует с 1937 года. В России продукцию выпускает завод в Егорьевске (Московская область), один из крупнейших заводов ISOVER в мире и единственный в стране, где производят теплоизоляцию из кварцевого стекловолокна повышенной прочности.',
  },
  'Metrotile': {
    title: 'Metrotile (Метротайл) — купить в Московской области',
    description: 'Metrotile: бельгийская композитная черепица на стальной основе. Цены от дилера, скидка −17%. Доставка по МО.',
    intro: 'Metrotile (Метротайл) — бельгийский производитель композитной черепицы. В наличии с доставкой по Московской области.',
    about:
      'Metrotile — бельгийская компания с более чем 50-летней историей производства композитной черепицы (стальной лист с посыпкой из базальтовых гранул) — материал сочетает лёгкий вес металлочерепицы с внешним видом натуральной черепицы или сланца. Продукция поставляется более чем в 80 стран, у Metrotile несколько производственных площадок, включая завод в Бельгии.',
  },
}

/**
 * Единый текст о том, как оформить гарантийное обращение — показывается на
 * всех бренд-страницах одинаково (сам процесс не зависит от бренда, а вот
 * срок гарантии и страну — см. getBrandStats() — берём из данных каталога).
 */
export const BRAND_WARRANTY_CLAIM_TEXT =
  'Если в течение гарантийного срока обнаружился заводской брак — расхождение по цвету, деформация, разрушение покрытия — свяжитесь с нами по телефону +7 (933) 203-30-05. Поможем оформить обращение к производителю: подскажем, какие документы и фото нужны для акта, и будем на связи с брендом до решения вопроса.'

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

export interface BrandFaqItem {
  q: string
  a: string
}

/**
 * FAQ для бренд-страницы — формулировки строятся из реальных данных
 * getBrandStats(), а не выдуманы, поэтому корректны для всех 75 брендов
 * без ручной работы. Используется И для видимого блока на странице (см.
 * BrandPage.tsx), И для FAQPage JSON-LD (page.tsx) — один и тот же массив,
 * чтобы разметка дословно совпадала с видимым текстом.
 */
export function getBrandFaq(brandName: string, stats: BrandStats): BrandFaqItem[] {
  const items: BrandFaqItem[] = []
  const warrantyParts: string[] = []

  if (stats.warrantyMin !== null && stats.warrantyMax !== null) {
    warrantyParts.push(
      stats.warrantyMin === stats.warrantyMax
        ? `${stats.warrantyMin} лет`
        : `от ${stats.warrantyMin} до ${stats.warrantyMax} лет — срок зависит от конкретной серии и коллекции`
    )
  }
  if (stats.hasLifetimeWarranty) warrantyParts.push('на часть коллекций производитель даёт пожизненную гарантию')
  if (stats.colorWarrantyMin !== null) {
    warrantyParts.push(
      stats.colorWarrantyMin === stats.colorWarrantyMax
        ? `отдельно на стабильность цвета — ${stats.colorWarrantyMin} лет`
        : `отдельно на стабильность цвета — от ${stats.colorWarrantyMin} до ${stats.colorWarrantyMax} лет`
    )
  }

  items.push({
    q: `Какая гарантия на продукцию ${brandName}?`,
    a: warrantyParts.length > 0
      ? `Гарантия производителя: ${warrantyParts.join('; ')}. Точный срок для конкретной модели указан на карточке товара и в гарантийном талоне, который идёт в комплекте. ${BRAND_WARRANTY_CLAIM_TEXT}`
      : `Гарантия предоставляется производителем и зависит от конкретной серии — точный срок указан на карточке товара и в документах, которые идут в комплекте. ${BRAND_WARRANTY_CLAIM_TEXT}`,
  })

  if (stats.countries.length > 0) {
    items.push({
      q: `Где производится ${brandName}?`,
      a: `Товары бренда ${brandName} в нашем каталоге произведены в: ${stats.countries.join(', ')}. Страна производства указана в характеристиках каждого конкретного товара.`,
    })
  }

  return items
}

export interface BrandStats {
  /** Страна(ы) производства, отсортированы по частоте встречаемости в товарах бренда. */
  countries: string[]
  /** Диапазон гарантии в годах по числовым значениям (без "Пожизненная"). */
  warrantyMin: number | null
  warrantyMax: number | null
  /** У хотя бы одного товара бренда гарантия указана как "Пожизненная". */
  hasLifetimeWarranty: boolean
  /** Отдельная гарантия на стабильность цвета — актуальна для сайдинга и металлочерепицы. */
  colorWarrantyMin: number | null
  colorWarrantyMax: number | null
}

/**
 * Реальные факты о бренде из данных парсера, а не из ручного текста —
 * features['Страна производства'] и features['Гарантия, лет'] заполнены у
 * большинства товаров каталога (см. комментарий над BRAND_SEO). Работает
 * для ВСЕХ 75 брендов со страницей, не только для тех восьми-девяти с
 * ручным описанием "о бренде" — это и закрывает задачу "откуда бренд,
 * какая гарантия" для всего списка брендов, а не только для топовых по
 * прямому спросу в Wordstat.
 */
export function getBrandStats(catalog: Catalog, brandName: string): BrandStats {
  const items = getBrandProducts(catalog, brandName)
  const countryCounts = new Map<string, number>()
  const warrantyYears: number[] = []
  const colorWarrantyYears: number[] = []
  let hasLifetimeWarranty = false

  for (const { product: p } of items) {
    const country = p.features?.['Страна производства']?.trim()
    if (country) countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1)

    const warranty = p.features?.['Гарантия, лет']?.trim()
    if (warranty) {
      if (/пожизнен/i.test(warranty)) {
        hasLifetimeWarranty = true
      } else {
        const n = parseFloat(warranty.replace(',', '.'))
        if (!Number.isNaN(n)) warrantyYears.push(n)
      }
    }

    const colorWarranty = p.features?.['Гарантия на цвет']?.trim()
    if (colorWarranty) {
      const n = parseFloat(colorWarranty.replace(',', '.'))
      if (!Number.isNaN(n)) colorWarrantyYears.push(n)
    }
  }

  const countries = Array.from(countryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)

  return {
    countries,
    warrantyMin: warrantyYears.length ? Math.min(...warrantyYears) : null,
    warrantyMax: warrantyYears.length ? Math.max(...warrantyYears) : null,
    hasLifetimeWarranty,
    colorWarrantyMin: colorWarrantyYears.length ? Math.min(...colorWarrantyYears) : null,
    colorWarrantyMax: colorWarrantyYears.length ? Math.max(...colorWarrantyYears) : null,
  }
}
