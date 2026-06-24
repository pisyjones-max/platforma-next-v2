'use client'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useUI } from '@/context/UIContext'
import { PHONE_NUMBER } from '@/lib/constants'

const NAV = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/delivery', label: 'Доставка' },
  { href: '/about', label: 'О компании' },
]

const YANDEX_MAPS_URL = 'https://yandex.ru/maps/?text=Ногинск+кровельные+материалы+PLATFORMA'

export function Header() {
  const { count } = useCart()
  const { openCart, openLoyalty, openConsult } = useUI()

  return (
    <header id="hdr">
      <Link href="/" className="logo">PLAT<em>FORMA</em></Link>

      <nav style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{
            padding: '0 12px', height: 34, display: 'flex', alignItems: 'center',
            fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.7)',
            borderRadius: 8, transition: 'all .15s',
          }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,.1)'; (e.target as HTMLElement).style.color = '#fff' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'none'; (e.target as HTMLElement).style.color = 'rgba(255,255,255,.7)' }}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      <div className="hbts" style={{ marginLeft: 'auto' }}>
        {/* Карта лояльности */}
        <button onClick={openLoyalty} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 11px', height: 34,
          borderRadius: 8, background: 'rgba(200,150,12,.15)', border: '1px solid rgba(200,150,12,.3)',
          color: '#C8960C', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
          whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,150,12,.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(200,150,12,.15)')}
        >
          💳 Карта
        </button>

        {/* Вызов специалиста */}
        <button onClick={openConsult} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 11px', height: 34,
          borderRadius: 8, background: 'rgba(255,255,255,.1)', border: 'none',
          color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .15s',
          whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}
        >
          🔧 Замер
        </button>

        {/* Яндекс Карты */}
        <a href={YANDEX_MAPS_URL} target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '0 11px', height: 34,
          borderRadius: 8, background: 'rgba(255,255,255,.1)',
          color: '#fff', fontSize: 12, fontWeight: 500, textDecoration: 'none', transition: 'background .15s',
          whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}
        >
          📍 Адрес
        </a>

        {/* Telegram */}
        <a href="https://t.me/platforma_roof" target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 11px', height: 34,
          borderRadius: 8, background: 'rgba(255,255,255,.1)', color: '#fff',
          fontSize: 12, fontWeight: 500, textDecoration: 'none', transition: 'background .15s',
          whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}
        >
          💬 TG
        </a>

        <a href={`tel:${PHONE_NUMBER}`} style={{
          color: '#7ECC9A', fontWeight: 700, fontSize: 14,
          textDecoration: 'none', whiteSpace: 'nowrap', padding: '0 8px',
        }}>
          {PHONE_NUMBER}
        </a>

        <button className="hbt" onClick={openCart} aria-label="Корзина">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {count > 0 && <span className="cbadge">{count}</span>}
        </button>
      </div>
    </header>
  )
}
