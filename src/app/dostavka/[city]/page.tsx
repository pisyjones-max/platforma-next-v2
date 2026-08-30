import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CITIES, getCity } from '@/lib/cities'
import { getCatalog } from '@/lib/catalog'
import { SITE_URL } from '@/lib/site'
import { breadcrumbSchema } from '@/lib/schema'
import { CityConsultButton } from '@/components/ui/CityConsultButton'
import { DISTRICT_COMMERCE_GROUPS } from '@/lib/districtCommerce'

export function generateStaticParams() {
  return CITIES.map(c => ({ city: c.slug }))
}

// См. комментарий в src/lib/catalog.ts — страница статически сгенерирована
// (generateStaticParams), без явной ревалидации так и осталась бы навсегда
// со снимком каталога на момент билда. Раз в 10 минут перегенерируется
// в фоне со свежими данными, без ребилда и рестарта сайта.
export const revalidate = 600

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: citySlug } = await params
  const city = getCity(citySlug)
  if (!city) return {}
  return {
    title: `Доставка кровельных и фасадных материалов в ${city.nameGenitive} — PLATFORMA`,
    description: `Доставка кровельных, фасадных материалов и водостоков в ${city.nameGenitive}: ${city.distanceNote}. Профлист, металлочерепица, сайдинг со склада в Новохаритонове.`,
    alternates: { canonical: `/dostavka/${city.slug}` },
  }
}

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '24px',
}

export default async function CityDeliveryPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params
  const city = getCity(citySlug)
  if (!city) return notFound()

  const catalog = getCatalog()
  const groups = Object.entries(catalog.groups).slice(0, 8)
  const commerceGroups = DISTRICT_COMMERCE_GROUPS
    .map(slug => ({ slug, group: catalog.groups[slug] }))
    .filter((g): g is { slug: typeof g.slug; group: NonNullable<typeof g.group> } => Boolean(g.group))

  const bcSchema = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    { name: 'Доставка', url: '/delivery' },
    { name: city.name, url: `/dostavka/${city.slug}` },
  ])

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 80px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bcSchema) }}
      />

      <h1 style={{ fontFamily: 'var(--fh)', fontSize: 30, fontWeight: 800, marginBottom: 8 }}>
        Доставка стройматериалов в {city.nameGenitive}
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 15.5, lineHeight: 1.6, maxWidth: 640 }}>
        {city.intro}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
        <div style={CARD_STYLE}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🚚</div>
          <div style={{ fontFamily: 'var(--fh)', fontWeight: 700, marginBottom: 8 }}>Срок доставки</div>
          <div style={{ fontSize: 15, color: 'var(--muted)' }}>{city.distanceNote}</div>
        </div>
        <div style={CARD_STYLE}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🗺️</div>
          <div style={{ fontFamily: 'var(--fh)', fontWeight: 700, marginBottom: 8 }}>Маршрут</div>
          <div style={{ fontSize: 15, color: 'var(--muted)' }}>Едем {city.route}</div>
        </div>
        <div style={CARD_STYLE}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📍</div>
          <div style={{ fontFamily: 'var(--fh)', fontWeight: 700, marginBottom: 8 }}>Обслуживаем район</div>
          <div style={{ fontSize: 15, color: 'var(--muted)' }}>{city.landmarks.join(', ')}</div>
        </div>
      </div>

      {commerceGroups.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Цены и доставка по категориям в {city.nameGenitive}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {commerceGroups.map(({ slug, group }) => (
              <Link
                key={slug}
                href={`/dostavka/${city.slug}/${slug}`}
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
                {group.name} в {city.nameGenitive} →
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
          Что чаще всего заказывают в {city.nameGenitive}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {groups.map(([slug, g]) => (
            <Link
              key={slug}
              href={`/catalog/group/${slug}`}
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
              {g.name} →
            </Link>
          ))}
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #192C1E, #253d2b)',
        borderRadius: 16, padding: '32px', color: '#fff',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Оформите заказ с доставкой в {city.nameGenitive}
          </div>
          <div style={{ fontSize: 15, opacity: 0.75 }}>
            Или позвоните: <a href="tel:+79332033005" style={{ color: '#fff' }}>+7 (933) 203-30-05</a>
          </div>
        </div>
        <CityConsultButton city={city.name} />
      </div>

      <p style={{ marginTop: 32, fontSize: 14, color: 'var(--muted)' }}>
        Смотрите также: <Link href="/delivery" style={{ color: 'var(--accent)' }}>все зоны доставки</Link> и полный{' '}
        <Link href="/catalog/group/krovlya" style={{ color: 'var(--accent)' }}>каталог кровельных материалов</Link>.
      </p>
    </div>
  )
}
