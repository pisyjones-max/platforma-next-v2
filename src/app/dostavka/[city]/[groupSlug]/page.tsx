import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CITIES, getCity } from '@/lib/cities'
import { getCatalog } from '@/lib/catalog'
import {
  DISTRICT_COMMERCE_GROUPS,
  GROUP_COMMERCE_META,
  getGroupPriceRange,
  getGroupTopCategories,
} from '@/lib/districtCommerce'
import { breadcrumbSchema, faqSchema, jsonLdScriptProps } from '@/lib/schema'
import { CityConsultButton } from '@/components/ui/CityConsultButton'

export function generateStaticParams() {
  return CITIES.flatMap(c =>
    DISTRICT_COMMERCE_GROUPS.map(groupSlug => ({ city: c.slug, groupSlug }))
  )
}

// См. комментарий в src/app/dostavka/[city]/page.tsx — та же логика:
// цены на странице живые (считаются из catalog.json при рендере), поэтому
// без ревалидации страница застыла бы со старыми цифрами навсегда.
export const revalidate = 600

interface Params {
  city: string
  groupSlug: string
}

function resolve(params: Params) {
  const city = getCity(params.city)
  const meta = GROUP_COMMERCE_META[params.groupSlug as keyof typeof GROUP_COMMERCE_META]
  if (!city || !meta) return null
  const catalog = getCatalog()
  const group = catalog.groups[params.groupSlug]
  if (!group) return null
  return { city, meta, catalog, group, groupSlug: params.groupSlug }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolved = resolve(await params)
  if (!resolved) return {}
  const { city, group, catalog, groupSlug } = resolved
  const priceRange = getGroupPriceRange(catalog, groupSlug)
  const priceNote = priceRange ? ` Цены от ${priceRange.min.toLocaleString('ru-RU')} ₽.` : ''

  return {
    title: `${group.name} в ${city.nameGenitive} — цены и доставка`,
    description: `Купить ${group.name.toLowerCase()} с доставкой в ${city.nameGenitive}: ${city.distanceNote}.${priceNote} Скидка −17%, самовывоз со склада в Новохаритонове.`,
    alternates: { canonical: `/dostavka/${city.slug}/${groupSlug}` },
  }
}

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '24px',
}

export default async function DistrictCommercePage({ params }: { params: Promise<Params> }) {
  const resolved = resolve(await params)
  if (!resolved) return notFound()
  const { city, meta, catalog, group, groupSlug } = resolved

  const priceRange = getGroupPriceRange(catalog, groupSlug)
  const topCategories = getGroupTopCategories(catalog, groupSlug)
  const faqAnswer = meta.faqAnswerTpl(city.nameGenitive, city.distanceNote)

  const bcSchema = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    { name: 'Доставка', url: '/delivery' },
    { name: city.name, url: `/dostavka/${city.slug}` },
    { name: group.name, url: `/dostavka/${city.slug}/${groupSlug}` },
  ])
  const faq = faqSchema([{ q: meta.faqQuestion, a: faqAnswer }])

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 80px' }}>
      <script {...jsonLdScriptProps(bcSchema)} />
      <script {...jsonLdScriptProps(faq)} />

      <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 10 }}>
        <Link href={`/dostavka/${city.slug}`} style={{ color: 'var(--muted)' }}>
          Доставка в {city.nameGenitive}
        </Link>
        {' → '}{group.name}
      </p>

      <h1 style={{ fontFamily: 'var(--fh)', fontSize: 30, fontWeight: 800, marginBottom: 8 }}>
        {group.name} в {city.nameGenitive} — цены и доставка
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 15.5, lineHeight: 1.6, maxWidth: 640 }}>
        Возим {meta.accusative} в {city.nameGenitive} и окрестности{' '}
        {city.landmarks.length > 0 && `(${city.landmarks.join(', ')})`} напрямую со склада в Новохаритонове —
        без перекупщиков и посредников, поэтому цена ниже, чем у большинства местных точек продаж.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
        {priceRange && (
          <div style={CARD_STYLE}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>💰</div>
            <div style={{ fontFamily: 'var(--fh)', fontWeight: 700, marginBottom: 8 }}>Цены</div>
            <div style={{ fontSize: 15, color: 'var(--muted)' }}>
              от {priceRange.min.toLocaleString('ru-RU')} ₽ до {priceRange.max.toLocaleString('ru-RU')} ₽,{' '}
              {priceRange.productCount} позиций в наличии
            </div>
          </div>
        )}
        <div style={CARD_STYLE}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🚚</div>
          <div style={{ fontFamily: 'var(--fh)', fontWeight: 700, marginBottom: 8 }}>Срок доставки</div>
          <div style={{ fontSize: 15, color: 'var(--muted)' }}>{city.distanceNote}</div>
        </div>
        <div style={CARD_STYLE}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📦</div>
          <div style={{ fontFamily: 'var(--fh)', fontWeight: 700, marginBottom: 8 }}>Как везём</div>
          <div style={{ fontSize: 15, color: 'var(--muted)' }}>{meta.unitNote}</div>
        </div>
      </div>

      {topCategories.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Что можно заказать с доставкой в {city.nameGenitive}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {topCategories.map(c => (
              <Link
                key={c.slug}
                href={`/catalog/${c.slug}`}
                style={{
                  display: 'block',
                  fontSize: 15,
                  fontWeight: 600,
                  padding: '14px 16px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  color: 'var(--dark, #1a1a1a)',
                  textDecoration: 'none',
                }}
              >
                {c.name} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({c.productsCount})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
          {meta.faqQuestion}
        </h2>
        <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 640 }}>{faqAnswer}</p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #192C1E, #253d2b)',
        borderRadius: 16, padding: '32px', color: '#fff',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Рассчитаем доставку {meta.accusative} в {city.nameGenitive}
          </div>
          <div style={{ fontSize: 15, opacity: 0.75 }}>
            Или позвоните: <a href="tel:+79332033005" style={{ color: '#fff' }}>+7 (933) 203-30-05</a>
          </div>
        </div>
        <CityConsultButton city={city.name} />
      </div>

      <p style={{ marginTop: 32, fontSize: 14, color: 'var(--muted)' }}>
        Смотрите также: <Link href={`/dostavka/${city.slug}`} style={{ color: 'var(--accent)' }}>доставка в {city.nameGenitive}</Link>,{' '}
        полный <Link href={`/catalog/group/${groupSlug}`} style={{ color: 'var(--accent)' }}>каталог {group.name.toLowerCase()}</Link> и{' '}
        <Link href="/delivery" style={{ color: 'var(--accent)' }}>все зоны доставки</Link>.
      </p>
    </div>
  )
}
