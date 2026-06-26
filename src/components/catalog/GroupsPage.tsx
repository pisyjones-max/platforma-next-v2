'use client'
import Link from 'next/link'
import { PHONE_NUMBER } from '@/lib/constants'
import { HomeCalculator } from '@/components/ui/HomeCalculator'
import { HomeFAQ } from '@/components/ui/HomeFAQ'
import type { Catalog } from '@/types/catalog'

const GROUP_ICONS: Record<string, string> = {
  krovlya:       '🏠',
  izolyatsiya:   '🧱',
  fasad:         '🏗️',
  vodostoki:     '🌧️',
  krepezhnyye:   '🔩',
  aksessuary:    '🛠️',
}

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
            {catalog.meta?.total_products ?? 0} товаров в наличии · Скидка −17% на всё · Доставка от 1 дня
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
          <div className="hero-badge"><div className="hero-badge-val">−17%</div><div className="hero-badge-lbl">скидка</div></div>
          <div className="hero-stat"><span>1</span><small>день доставка</small></div>
        </div>
      </div>

      {/* Преимущества */}
      <div className="home-features">
        {[
          { icon: '🚚', title: 'Быстрая доставка', sub: 'По Московской области от 1 дня' },
          { icon: '💰', title: 'Скидка −17%', sub: 'На весь ассортимент сайта' },
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

      {/* Калькулятор */}
      <HomeCalculator />

      {/* Категории */}
      <div style={{ marginTop: 40 }}>
        <h2 className="prod-section-title">Категории товаров</h2>
        <div className="ggrid">
          {Object.entries(catalog.groups).map(([slug, g]) => (
            <Link key={slug} href={`/catalog/group/${slug}`} className="gcard">
              <div style={{ fontSize: 24, marginRight: 4, flexShrink: 0 }}>
                {GROUP_ICONS[slug] ?? '📦'}
              </div>
              <div className="gcard-info">
                <div className="gcard-title">{g.name}</div>
                <div className="gcard-sub">{g.categories.length} категорий</div>
              </div>
              <div className="gcard-arrow">›</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Социальное доказательство */}
      <div style={{
        marginTop: 40,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
      }}>
        {[
          { icon: '⭐', val: '4.9', label: 'Средняя оценка' },
          { icon: '📦', val: '2 000+', label: 'Заказов выполнено' },
          { icon: '🏢', val: '120+', label: 'Брендов в каталоге' },
          { icon: '🗓️', val: '5 лет', label: 'На рынке МО' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '18px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--fh)', fontSize: 22, fontWeight: 800, color: 'var(--accent)', marginBottom: 3 }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <HomeFAQ />

      {/* Нижний CTA */}
      <div style={{
        marginTop: 48, marginBottom: 16,
        background: 'linear-gradient(135deg, #1a3828 0%, #253d2b 100%)',
        borderRadius: 20, padding: '32px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 20, flexWrap: 'wrap', color: '#fff',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
            Нужна помощь с выбором материала?
          </div>
          <div style={{ fontSize: 13.5, opacity: 0.75 }}>
            Специалист подберёт оптимальное решение под ваш проект и бюджет
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href={`tel:${PHONE_NUMBER}`} style={{
            padding: '12px 22px', borderRadius: 12,
            background: '#7ecc9a', color: '#0d1f14',
            fontWeight: 800, fontSize: 14, textDecoration: 'none',
          }}>
            📞 Позвонить
          </a>
          <a href="https://t.me/platforma_mo" target="_blank" rel="noopener noreferrer" style={{
            padding: '12px 22px', borderRadius: 12,
            background: 'rgba(255,255,255,.12)', color: '#fff',
            fontWeight: 700, fontSize: 14, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,.2)',
          }}>
            ✈️ Написать в Telegram
          </a>
        </div>
      </div>
    </div>
  )
}
