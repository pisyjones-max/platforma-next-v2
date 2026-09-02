import Link from 'next/link'
import { getCatalog } from '@/lib/catalog'
import { getAllBrands } from '@/lib/brands'
import type { Metadata } from 'next'

// См. комментарий в src/lib/catalog.ts — каталог читается с диска в рантайме.
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Бренды кровельных и фасадных материалов — PLATFORMA',
  description:
    'Технониколь, Grand Line, Docke, Fakro, Katepal, Tegola и другие производители кровли, сайдинга и фасадных материалов. Цены ниже конкурентов, доставка по Московской области.',
  alternates: { canonical: '/catalog/brand' },
}

export default function BrandHubPage() {
  const catalog = getCatalog()
  const brands = getAllBrands(catalog)

  return (
    <div id="main">
      <nav className="breadcrumb">
        <span className="bc-item bc-link"><Link href="/catalog">Каталог</Link></span>
        <span className="bc-sep">›</span>
        <span className="bc-item bc-cur">Бренды</span>
      </nav>

      <div className="hero">
        <div>
          <h1>Бренды</h1>
          <p>{brands.length} производителей · доставка по Московской области</p>
        </div>
      </div>

      <div className="ggrid">
        {brands.map(brand => (
          <Link key={brand.slug} href={`/catalog/brand/${brand.slug}`} className="gcard gcard-brand">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt={brand.name} className="gcard-brand-logo" loading="lazy" />
            ) : (
              <div className="gcard-brand-logo gcard-brand-logo-fallback">{brand.name}</div>
            )}
            <div className="gcard-info">
              <div className="gcard-title">{brand.name}</div>
              <div className="gcard-sub">{brand.count} товаров · {brand.categories.length} категорий</div>
            </div>
            <div className="gcard-arrow">›</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
