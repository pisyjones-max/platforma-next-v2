import { getCatalog, getCanonicalCategorySlug } from '@/lib/catalog'
import { SITE_URL } from '@/lib/site'
import { productSlug } from '@/lib/slug'
import { salePrice } from '@/lib/price'
import { imgUrl } from '@/lib/image'
import { normalizeBrand } from '@/lib/brandAliases'
import { PHONE_NUMBER } from '@/lib/constants'

// См. комментарий в src/lib/catalog.ts — каталог читается с диска в рантайме
// и кэшируется по mtime, поэтому фид всегда отдаёт актуальные цены без
// пересборки сайта. 600с ревалидации синхронизировано со страницами товара.
export const revalidate = 600

/**
 * YML-фид (формат Яндекс.Маркета) для подключения в Яндекс.Вебмастере
 * («Товары и цены») или в кабинете Яндекс.Бизнеса — именно эта связка,
 * а не сама по себе Schema.org-разметка, включает в сниппете иконки
 * доставки/самовывоза и актуальную цену (см. обсуждение с владельцем сайта).
 *
 * Курьерская доставка — по всей зоне обслуживания (Раменский район и
 * соседние города, см. src/lib/cities.ts), самовывоз — со склада в
 * Новохаритоново (тот же адрес, что в organizationSchema/src/lib/schema.ts).
 */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function ymlDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export async function GET() {
  const catalog = getCatalog()

  // Стабильные числовые id категорий — YML требует categoryId, а у нас
  // категории адресуются строковыми slug. Порядок берём из catalog.categories,
  // он не меняется хаотично (задаётся ночным парсером), так что id стабильны
  // между перегенерациями фида.
  const categoryIds = new Map<string, number>()
  catalog.categories.forEach((c, i) => categoryIds.set(c.slug, i + 1))

  const categoriesXml = catalog.categories
    .map(c => `    <category id="${categoryIds.get(c.slug)}">${xmlEscape(c.name)}</category>`)
    .join('\n')

  const offersXml: string[] = []

  for (const cat of catalog.categories) {
    if (cat.products.length === 0) continue

    for (const p of cat.products) {
      if (!p.variants?.length) continue // см. product page.tsx — без variants товара нет и на живой странице
      const v = p.variants[0]
      const price = salePrice(v.price ?? 0)
      if (price <= 0) continue // товары "по запросу" без цены не годятся для фида цен

      const canonicalSlug = getCanonicalCategorySlug(catalog, p, cat.slug)
      // Одному id товара соответствует ровно один offer в фиде, даже если он
      // лежит в нескольких категориях каталога — иначе Яндекс увидит дубли
      // предложений с одинаковым содержимым (та же логика, что и в canonical
      // на странице товара, см. lib/catalog.ts).
      if (canonicalSlug !== cat.slug) continue

      const url = `${SITE_URL}/catalog/${cat.slug}/${productSlug(p.id)}`
      const brand = normalizeBrand(p.features?.['Производитель'])
      const picture = v.images?.[0] ? imgUrl(v.images[0]) : ''
      const description = (p.description?.trim() || p.title).slice(0, 3000)

      offersXml.push(
        [
          `    <offer id="${xmlEscape(p.id)}" available="true">`,
          `      <url>${xmlEscape(url)}</url>`,
          `      <price>${price}</price>`,
          `      <currencyId>RUB</currencyId>`,
          `      <categoryId>${categoryIds.get(cat.slug)}</categoryId>`,
          picture ? `      <picture>${xmlEscape(picture)}</picture>` : '',
          `      <name>${xmlEscape(p.title)}</name>`,
          brand ? `      <vendor>${xmlEscape(brand)}</vendor>` : '',
          v.sku ? `      <vendorCode>${xmlEscape(v.sku)}</vendorCode>` : '',
          `      <description>${xmlEscape(description)}</description>`,
          // delivery/pickup — сигнал Яндексу для отображения иконок способов
          // получения заказа прямо в сниппете, вместе с ценой из <price>.
          `      <delivery>true</delivery>`,
          `      <pickup>true</pickup>`,
        ]
          .filter(Boolean)
          .join('\n') + '\n    </offer>'
      )
    }
  }

  const now = new Date()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${ymlDate(now)}">
  <shop>
    <name>PLATFORMA</name>
    <company>PLATFORMA</company>
    <url>${xmlEscape(SITE_URL)}</url>
    <currencies>
      <currency id="RUB" rate="1"/>
    </currencies>
    <categories>
${categoriesXml}
    </categories>
    <delivery-options>
      <option cost="0" days="1-3"/>
    </delivery-options>
    <pickup-options>
      <option cost="0" days="0-1"/>
    </pickup-options>
    <phone>${xmlEscape(PHONE_NUMBER)}</phone>
    <offers>
${offersXml.join('\n')}
    </offers>
  </shop>
</yml_catalog>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  })
}
