import Link from 'next/link'

type Brand = { slug: string; name: string; logoUrl: string }

export function BrandsMarquee({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null

  // Дублируем список — вторая копия нужна только для бесшовной петли анимации,
  // из выдачи её прячем через aria-hidden.
  const track = [...brands, ...brands]

  return (
    <div style={{ marginTop: 40 }}>
      <h2 className="prod-section-title">Бренды, которым доверяют</h2>
      <div className="brand-marquee">
        <div className="brand-marquee-track">
          {track.map((b, i) => (
            <Link
              key={`${b.slug}-${i}`}
              href={`/catalog/brand/${b.slug}`}
              className="brand-marquee-item"
              aria-hidden={i >= brands.length}
              tabIndex={i >= brands.length ? -1 : 0}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.logoUrl} alt={b.name} loading="lazy" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
