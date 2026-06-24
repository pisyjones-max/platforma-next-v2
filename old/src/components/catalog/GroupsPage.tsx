'use client'
import Link from 'next/link'
import type { Catalog } from '@/types/catalog'

export function GroupsPage({ catalog }: { catalog: Catalog }) {
  return (
    <main>
      <div className="hero">
        <div>
          <h1>Каталог кровельных материалов</h1>
          <p>Выберите категорию для просмотра товаров</p>
        </div>
        <div className="hero-right">
          <div className="hero-stat">
            <span>{catalog.meta.total_products}</span>
            <small>товаров</small>
          </div>
          <div className="hero-badge">
            <div className="hero-badge-val">−7%</div>
            <div className="hero-badge-lbl">скидка</div>
          </div>
        </div>
      </div>
      <div className="ggrid">
        {Object.entries(catalog.groups).map(([slug, g]) => (
          <Link key={slug} href={`/catalog/group/${slug}`} className="gcard gcard-group">
            <div className="gcard-info">
              <div className="gcard-title">{g.name}</div>
              <div className="gcard-sub">{g.categories.length} категорий</div>
            </div>
            <div className="gcard-arrow">›</div>
          </Link>
        ))}
      </div>
    </main>
  )
}
