'use client'
import Link from 'next/link'
import type { Group } from '@/types/catalog'

type CategorySummary = { slug: string; name: string; productsCount: number }

interface Props { groupSlug: string; group: Group; categories: CategorySummary[] }

export function GroupDetailPage({ group, categories: cats }: Props) {
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
        {cats.map(cat => (
          <Link key={cat.slug} href={`/catalog/${cat.slug}`} className="gcard">
            <div className="gcard-info">
              <div className="gcard-title">{cat.name}</div>
              <div className="gcard-sub">{cat.productsCount} товаров</div>
            </div>
            <div className="gcard-arrow">›</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
