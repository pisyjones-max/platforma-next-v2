'use client'
import Link from 'next/link'
import { useUI } from '@/context/UIContext'
import { PHONE_NUMBER, WORK_HOURS } from '@/lib/constants'
import { CITIES } from '@/lib/cities'

const YANDEX_MAPS_URL = 'https://yandex.ru/maps/?text=Новохаритоново+кровельные+материалы+PLATFORMA'

export function Footer() {
  const { openLoyalty, openConsult } = useUI()

  return (
    <footer style={{
      background: 'var(--dark)', color: 'rgba(255,255,255,.6)',
      padding: '40px 24px 24px', marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Кросс-промо: Сталь Крафт */}
        <a href="https://sk-craft.platforma-msk.ru" target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            flexWrap: 'wrap', textDecoration: 'none',
            background: 'linear-gradient(90deg, rgba(191,62,34,.12), rgba(191,62,34,.04))',
            border: '1px solid rgba(191,62,34,.3)', borderRadius: 12,
            padding: '14px 20px', marginBottom: 32,
          }}>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,.85)', lineHeight: 1.5 }}>
            <span style={{ fontSize: 16, marginRight: 8 }}>🏗️</span>
            Нужен <strong style={{ color: '#fff' }}>навес, гараж или ворота</strong>? Наш партнёр «Сталь Крафт» построит под ключ в Раменском округе
          </span>
          <span style={{
            flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#fff',
            background: '#BF3E22', padding: '8px 16px', borderRadius: 8, whiteSpace: 'nowrap',
          }}>
            Перейти на sk-craft →
          </span>
        </a>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, marginBottom: 32 }}>
          {/* Бренд */}
          <div>
            <div style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
              PLAT<span style={{ color: '#7ECC9A' }}>FORMA</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
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
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Контакты</div>
            <a href={`tel:${PHONE_NUMBER}`} style={{ color: '#7ECC9A', fontWeight: 700, fontSize: 15.5, display: 'block', marginBottom: 8, textDecoration: 'none' }}>
              {PHONE_NUMBER}
            </a>
            <p style={{ fontSize: 13, marginBottom: 6 }}>Пн–Пт: {WORK_HOURS.weekday.start}:00–{WORK_HOURS.weekday.end}:00</p>
            <p style={{ fontSize: 13, marginBottom: 12 }}>Сб: {WORK_HOURS.saturday.start}:00–{WORK_HOURS.saturday.end}:00</p>
            <a href={YANDEX_MAPS_URL} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: '#7ECC9A', textDecoration: 'none' }}>
              📍 Показать на карте
            </a>
          </div>

          {/* Каталог */}
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Каталог</div>
            {[
              { href: '/catalog', label: 'Все категории' },
              { href: '/fasad/fasad-doma', label: 'Фасад дома' },
              { href: '/fasad/sajding', label: 'Сайдинг' },
              { href: '/catalog/group/krovlya', label: 'Кровля' },
              { href: '/catalog/brand', label: 'Бренды' },
              { href: '/catalog/metallocherepitsa', label: 'Металлочерепица' },
              { href: '/catalog/profnastil', label: 'Профнастил' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Города */}
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Доставка по городам</div>
            {CITIES.map(c => (
              <Link key={c.slug} href={`/dostavka/${c.slug}`} style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>
                {c.name}
              </Link>
            ))}
          </div>

          {/* Сервис */}
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Сервис</div>
            <button onClick={openLoyalty} style={{
              display: 'block', fontSize: 13, marginBottom: 6, color: 'rgba(255,255,255,.6)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
            }}>💳 Карта лояльности</button>
            <button onClick={openConsult} style={{
              display: 'block', fontSize: 13, marginBottom: 6, color: 'rgba(255,255,255,.6)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
            }}>🔧 Вызов специалиста</button>
            <Link href="/delivery" style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>
              🚚 Доставка и оплата
            </Link>
            <Link href="/privacy" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>
              🔒 Политика данных (ФЗ-152)
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 10, fontSize: 12,
        }}>
          <span>© {new Date().getFullYear()} PLATFORMA. Все права защищены.</span>
          <span style={{ opacity: 0.4 }}>Московская область, Раменский округ</span>
        </div>
      </div>
    </footer>
  )
}
