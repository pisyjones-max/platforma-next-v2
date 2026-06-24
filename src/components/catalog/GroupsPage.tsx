'use client'
import Link from 'next/link'
import { PHONE_NUMBER } from '@/lib/constants'
import type { Catalog } from '@/types/catalog'

export function GroupsPage({ catalog }: { catalog: Catalog }) {
  return (
    <div id="main">
      {/* Hero */}
      <div className="home-hero">
        <div className="home-hero-left">
          <div className="home-hero-badge">🏠 Кровля · Фасады · Изоляция</div>
          <h1 className="home-hero-title">
            Строительные материалы<br />
            <span style={{ color: '#7ECC9A' }}>с доставкой по МО</span>
          </h1>
          <p className="home-hero-sub">
            {catalog.meta?.total_products ?? 0} товаров в наличии · Скидка −7% на всё · Доставка от 1 дня
          </p>
          <div className="home-hero-actions">
            <a href={`tel:${PHONE_NUMBER}`} className="home-hero-phone">
              📞 {PHONE_NUMBER}
            </a>
            <Link href="/catalog/group/krovlya" className="home-hero-btn">
              Смотреть каталог →
            </Link>
          </div>
        </div>
        <div className="home-hero-right">
          <div className="hero-stat"><span>{catalog.meta?.total_products ?? 0}</span><small>товаров</small></div>
          <div className="hero-badge"><div className="hero-badge-val">−7%</div><div className="hero-badge-lbl">скидка</div></div>
          <div className="hero-stat"><span>1</span><small>день доставка</small></div>
        </div>
      </div>

      {/* Преимущества */}
      <div className="home-features">
        {[
          { icon: '🚚', title: 'Быстрая доставка', sub: 'По Московской области от 1 дня' },
          { icon: '💰', title: 'Скидка −7%', sub: 'На весь ассортимент сайта' },
          { icon: '📞', title: 'Консультация', sub: 'Бесплатно по телефону' },
          { icon: '✅', title: 'Гарантия', sub: 'Официальная от производителей' },
        ].map(f => (
          <div key={f.title} className="home-feature">
            <div className="home-feature-icon">{f.icon}</div>
            <div className="home-feature-title">{f.title}</div>
            <div className="home-feature-sub">{f.sub}</div>
          </div>
        ))}
      </div>

      {/* Категории */}
      <div style={{ marginTop: 32 }}>
        <h2 className="prod-section-title">Категории товаров</h2>
        <div className="ggrid">
          {Object.entries(catalog.groups).map(([slug, g]) => (
            <Link key={slug} href={`/catalog/group/${slug}`} className="gcard">
              <div className="gcard-info">
                <div className="gcard-title">{g.name}</div>
                <div className="gcard-sub">{g.categories.length} категорий</div>
              </div>
              <div className="gcard-arrow">›</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
