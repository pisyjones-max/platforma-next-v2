'use client'
import Link from 'next/link'
import { useUI } from '@/context/UIContext'
import { PHONE_NUMBER } from '@/lib/constants'

const YANDEX_MAPS_URL = 'https://yandex.ru/maps/?text=Ногинск+кровельные+материалы+PLATFORMA'

export function Footer() {
  const { openLoyalty, openConsult } = useUI()

  return (
    <footer style={{
      background: 'var(--dark)', color: 'rgba(255,255,255,.6)',
      padding: '40px 24px 24px', marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, marginBottom: 32 }}>
          {/* Бренд */}
          <div>
            <div style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
              PLAT<span style={{ color: '#7ECC9A' }}>FORMA</span>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 14 }}>
              Кровельные и строительные материалы с доставкой по Московской области
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href="https://t.me/platforma_roof" target="_blank" rel="noopener noreferrer"
                style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, textDecoration: 'none' }}>
                💬
              </a>
            </div>
          </div>

          {/* Контакты */}
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Контакты</div>
            <a href={`tel:${PHONE_NUMBER}`} style={{ color: '#7ECC9A', fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 8, textDecoration: 'none' }}>
              {PHONE_NUMBER}
            </a>
            <p style={{ fontSize: 12, marginBottom: 6 }}>Пн–Пт: 9:00–18:00</p>
            <p style={{ fontSize: 12, marginBottom: 12 }}>Сб: 9:00–14:00</p>
            <a href={YANDEX_MAPS_URL} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#7ECC9A', textDecoration: 'none' }}>
              📍 Показать на карте
            </a>
          </div>

          {/* Каталог */}
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Каталог</div>
            {[
              { href: '/catalog', label: 'Все категории' },
              { href: '/catalog/metallocherepica', label: 'Металлочерепица' },
              { href: '/catalog/profnastil', label: 'Профнастил' },
              { href: '/catalog/krovelnye-materialy', label: 'Кровельные материалы' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Сервис */}
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Сервис</div>
            <button onClick={openLoyalty} style={{
              display: 'block', fontSize: 12, marginBottom: 6, color: 'rgba(255,255,255,.6)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
            }}>💳 Карта лояльности</button>
            <button onClick={openConsult} style={{
              display: 'block', fontSize: 12, marginBottom: 6, color: 'rgba(255,255,255,.6)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
            }}>🔧 Вызов специалиста</button>
            <Link href="/delivery" style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>
              🚚 Доставка и оплата
            </Link>
            <Link href="/privacy" style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>
              🔒 Политика данных (ФЗ-152)
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 10, fontSize: 11,
        }}>
          <span>© {new Date().getFullYear()} PLATFORMA. Все права защищены.</span>
          <span style={{ opacity: 0.4 }}>Московская область, Ногинский район</span>
        </div>
      </div>
    </footer>
  )
}
