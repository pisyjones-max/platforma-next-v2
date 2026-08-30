import Link from 'next/link'
import { CITIES } from '@/lib/cities'
import { DISTRICT_COMMERCE_GROUPS } from '@/lib/districtCommerce'

/** Обратная линковка: со страницы группы товаров ведём на /dostavka/[city]/[groupSlug]
 *  для всех районов, где эта группа входит в коммерческий список. */
export function DistrictLinksBlock({ groupSlug, groupName }: { groupSlug: string; groupName: string }) {
  if (!(DISTRICT_COMMERCE_GROUPS as readonly string[]).includes(groupSlug)) return null

  return (
    <div style={{ marginTop: 32, padding: '20px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 12 }}>
        ДОСТАВКА ПО РАЙОНАМ
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CITIES.map(c => (
          <Link
            key={c.slug}
            href={`/dostavka/${c.slug}/${groupSlug}`}
            style={{
              fontSize: 14,
              color: 'var(--dark, #1a1a1a)',
              textDecoration: 'none',
              padding: '8px 14px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          >
            {groupName} в {c.name} →
          </Link>
        ))}
      </div>
    </div>
  )
}
