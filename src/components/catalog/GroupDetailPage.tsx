'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Group } from '@/types/catalog'
import { fmt } from '@/lib/price'
import { PHONE_NUMBER } from '@/lib/constants'
import { getServicesForGroup } from '@/lib/services'

type CategorySummary = { slug: string; name: string; productsCount: number }

interface ComparisonOption {
  slug: string
  title: string
  url: string
  pros: string[]
  bestFor: string
  priceUnit: string
  icon: string
  durability: string
  fireSafety: string
  productCount: number
  minPrice: number | null
}

interface FaqItem { q: string; a: string }

interface Props {
  groupSlug: string
  group: Group
  categories: CategorySummary[]
  /**
   * Сравнительный контент (карточки + таблица) для групп, где голого
   * листинга категорий недостаточно для закрытия высокочастотного
   * "хабового" запроса — сейчас только для /catalog/group/krovlya,
   * см. src/lib/krovlyaHub.ts. Остальные группы рендерятся как раньше.
   */
  comparison?: ComparisonOption[]
  faq?: FaqItem[]
}

// Группы, для которых имеет смысл предложить "примерить" материал на дом
// через бесплатный дизайн-проект (визуальные, "фасадные" материалы).

export function GroupDetailPage({ groupSlug, group, categories: cats, comparison, faq }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const telHref = `tel:${PHONE_NUMBER.replace(/[^\d+]/g, '')}`

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

      {getServicesForGroup(groupSlug).map(service => (
        <Link key={service.slug} href={service.urlPath} className="design-strip montazh-strip">
          <div className="design-strip-text">
            {service.ctaLabel}
            <small>{service.ctaSubLabel}</small>
          </div>
          <div className="design-strip-cta">Оставить заявку →</div>
        </Link>
      ))}

      {comparison && comparison.length > 0 && (
        <>
          <div style={{ marginTop: 32, marginBottom: 8 }}>
            <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>
              Как выбрать материал
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.7, maxWidth: 760, margin: 0 }}>
              Ниже — самые востребованные варианты с ориентировочными ценами и сроком службы.
              Полный список всех категорий раздела — ниже под сравнением.
            </p>
          </div>

          <div className="ggrid" style={{ marginTop: 24 }}>
            {comparison.map(opt => (
              <Link key={opt.slug} href={opt.url} className="gcard">
                <div className="gcard-info">
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{opt.icon}</div>
                  <div className="gcard-title">{opt.title}</div>
                  <div className="gcard-sub">
                    {opt.productCount > 0 ? `${opt.productCount} товаров` : 'скоро в наличии'}
                    {opt.minPrice ? ` · от ${fmt(opt.minPrice)} ₽/${opt.priceUnit}` : ''}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
                    {opt.bestFor}
                  </p>
                  <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
                    {opt.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                  </ul>
                </div>
                <div className="gcard-arrow">›</div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, margin: '0 0 14px' }}>
              Материалы в сравнении
            </h2>
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700 }}>Материал</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700 }}>Цена от</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700 }}>Срок службы</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700 }}>Пожаробезопасность</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((opt, i) => (
                    <tr key={opt.slug} style={{ borderTop: '1px solid var(--border)', background: i % 2 ? 'var(--surface)' : 'transparent' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        <Link href={opt.url} style={{ color: 'var(--text)', textDecoration: 'none' }}>{opt.title}</Link>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>
                        {opt.minPrice ? `${fmt(opt.minPrice)} ₽/${opt.priceUnit}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{opt.durability}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{opt.fireSafety}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: 40, marginBottom: 8 }}>
            <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>
              Все категории раздела «{group.name}»
            </h2>
          </div>
        </>
      )}

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

      {faq && faq.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>
            Частые вопросы про {group.name.toLowerCase()}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faq.map((item, i) => {
              const isOpen = openFaq === i
              return (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface)',
                    border: `1.5px solid ${isOpen ? 'rgba(126,204,154,.4)' : 'var(--border)'}`,
                    borderRadius: 14,
                    overflow: 'hidden',
                    transition: 'border-color .2s',
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: 12,
                      padding: '16px 20px', background: 'none', border: 'none',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, flex: 1 }}>
                      {item.q}
                    </span>
                    <span style={{
                      fontSize: 18, color: isOpen ? '#7ecc9a' : 'var(--muted)',
                      transition: 'transform .25s, color .2s',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      flexShrink: 0, lineHeight: 1,
                    }}>+</span>
                  </button>
                  <div style={{ maxHeight: isOpen ? 400 : 0, overflow: 'hidden', transition: 'max-height .3s cubic-bezier(0.4,0,0.2,1)' }}>
                    <div style={{
                      padding: '0 20px 18px', fontSize: 14.5, lineHeight: 1.75, color: 'var(--muted)',
                      borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 0,
                    }}>
                      {item.a}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {comparison && comparison.length > 0 && (
        <div style={{
          marginTop: 32, padding: '24px 28px', background: 'rgba(126,204,154,.08)',
          border: '1px solid rgba(126,204,154,.25)', borderRadius: 16,
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 30 }}>📐</span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Не определились с материалом?</div>
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>
              Расскажите нам о доме — подберём материал под бюджет и посчитаем стоимость с монтажом.
            </div>
          </div>
          <a
            href={telHref}
            style={{
              padding: '12px 24px', background: 'linear-gradient(135deg, #7ecc9a, #4caf70)',
              borderRadius: 10, color: '#0d1f14', fontWeight: 800, fontSize: 15,
              textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            📞 {PHONE_NUMBER}
          </a>
        </div>
      )}
    </div>
  )
}
