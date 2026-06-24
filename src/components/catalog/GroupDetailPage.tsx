'use client'
import Link from 'next/link'
import type { Catalog, Group } from '@/types/catalog'

interface Props { groupSlug: string; group: Group; catalog: Catalog }

export function GroupDetailPage({ groupSlug, group, catalog }: Props) {
  const cats = group.categories
    .map(s => catalog.categories.find(c => c.slug === s))
    .filter(Boolean)

  return (
    <div id="main">
      <nav className="breadcrumb">
        <span className="bc-item bc-link"><Link href="/">Каталог</Link></span>
        <span className="bc-sep">›</span>
        <span className="bc-item bc-cur">{group.name}</span>
      </nav>

      <div className="hero">
        <div>
          <h1>{group.name}</h1>
          <p>{cats.length} категорий · Доставка по Московской области</p>
        </div>
      </div>

      <div className="ggrid">
        {cats.map(cat => cat && (
          <Link key={cat.slug} href={`/catalog/${cat.slug}`} className="gcard">
            <div className="gcard-info">
              <div className="gcard-title">{cat.name}</div>
              <div className="gcard-sub">{cat.products.length} товаров</div>
            </div>
            <div className="gcard-arrow">›</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
