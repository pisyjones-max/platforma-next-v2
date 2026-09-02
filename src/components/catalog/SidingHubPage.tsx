'use client'
import { useState } from 'react'
import Link from 'next/link'
import { fmt } from '@/lib/price'
import { PHONE_NUMBER } from '@/lib/constants'

interface SidingOptionView {
  slug: string
  title: string
  url: string
  pros: string[]
  bestFor: string
  priceUnit: string
  icon: string
  productCount: number
  minPrice: number | null
}

interface Props {
  options: SidingOptionView[]
  faq: { q: string; a: string }[]
}

const DURABILITY: Record<string, string> = {
  vinilovyy: '20-30 лет',
  metallicheskiy: '30-50 лет',
  fibrotsementnyy: '50+ лет',
  cokolnyy: '30-50 лет',
  'pod-derevo': '20-30 лет',
}

const FIRE_SAFETY: Record<string, string> = {
  vinilovyy: 'горюч',
  metallicheskiy: 'негорюч',
  fibrotsementnyy: 'негорюч (НГ)',
  cokolnyy: 'горюч',
  'pod-derevo': 'горюч',
}

export function SidingHubPage({ options, faq }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const telHref = `tel:${PHONE_NUMBER.replace(/[^\d+]/g, '')}`

  return (
    <div id="main">
      <nav className="breadcrumb">
        <span className="bc-item bc-link"><Link href="/">Каталог</Link></span>
        <span className="bc-sep">›</span>
        <span className="bc-item bc-cur">Сайдинг</span>
      </nav>

      <div className="hero">
        <div>
          <h1>Сайдинг для дома — виды, цены, как выбрать</h1>
          <p>
            Виниловый, металлический, фиброцементный, цокольный сайдинг и панели под дерево —
            сравните варианты и перейдите в нужный раздел каталога. Доставка по Московской
            области.
          </p>
        </div>
      </div>

      {/* --- Как выбрать --- */}
      <div style={{ marginTop: 32, marginBottom: 8 }}>
        <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>
          Как выбрать сайдинг
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.7, maxWidth: 760, margin: 0 }}>
          Три вопроса, которые определяют выбор: бюджет, требования к прочности и что именно вы
          отделываете — стены дома или цоколь. Если бюджет ограничен и нужен быстрый монтаж —
          берите виниловый сайдинг, это самый популярный и доступный вариант. Если важна
          повышенная прочность и пожаробезопасность — присмотритесь к металлическому или
          фиброцементному. Цоколь дома отделывается отдельно — для него есть специальный
          цокольный сайдинг, рассчитанный на нагрузки у земли. Хотите вид дерева, бруса или
          камня без ухода за натуральным материалом — панели под дерево/камень решают эту задачу.
        </p>
      </div>

      {/* --- Карточки материалов --- */}
      <div className="ggrid" style={{ marginTop: 24 }}>
        {options.map(opt => (
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

      {/* --- Сравнительная таблица --- */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, margin: '0 0 14px' }}>
          Виды сайдинга в сравнении
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
              {options.map((opt, i) => (
                <tr key={opt.slug} style={{ borderTop: '1px solid var(--border)', background: i % 2 ? 'var(--surface)' : 'transparent' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    <Link href={opt.url} style={{ color: 'var(--text)', textDecoration: 'none' }}>{opt.title}</Link>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>
                    {opt.minPrice ? `${fmt(opt.minPrice)} ₽/${opt.priceUnit}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>
                    {DURABILITY[opt.slug] ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>
                    {FIRE_SAFETY[opt.slug] ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Бренд Docke --- */}
      <div style={{
        marginTop: 32, padding: '20px 24px', background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 16,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 28 }}>🏭</span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Сайдинг Docke (Деке)</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>
            Один из самых узнаваемых брендов сайдинга — широкая линейка виниловых панелей
            и фасадных аксессуаров. Весь модельный ряд в наличии.
          </div>
        </div>
        <Link
          href="/catalog/brand/docke"
          style={{
            padding: '10px 20px', background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text)', fontWeight: 700, fontSize: 14,
            textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          Смотреть Docke →
        </Link>
      </div>

      {/* --- FAQ --- */}
      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>
          Частые вопросы про сайдинг
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

      {/* --- CTA --- */}
      <div style={{
        marginTop: 32, padding: '24px 28px', background: 'rgba(126,204,154,.08)',
        border: '1px solid rgba(126,204,154,.25)', borderRadius: 16,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 30 }}>📐</span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Не определились с видом сайдинга?</div>
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
    </div>
  )
}
