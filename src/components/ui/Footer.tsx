import Link from 'next/link'
import { PHONE_NUMBER } from '@/lib/constants'

export function Footer() {
  return (
    <footer style={{
      background: 'var(--dark)', color: 'rgba(255,255,255,.6)',
      marginTop: 48, padding: '32px 24px',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
        <div>
          <div style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
            PLAT<span style={{ color: '#7ECC9A' }}>FORMA</span>
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.7 }}>
            Кровельные и строительные материалы с доставкой по Московской области
          </p>
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Контакты</div>
          <a href={`tel:${PHONE_NUMBER}`} style={{ color: '#7ECC9A', fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 8, textDecoration: 'none' }}>
            {PHONE_NUMBER}
          </a>
          <p style={{ fontSize: 12 }}>Пн–Пт: 9:00–18:00</p>
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Информация</div>
          <Link href="/privacy" style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>
            Политика обработки данных (ФЗ-152)
          </Link>
          <Link href="/" style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>
            Каталог
          </Link>
        </div>
      </div>
      <div style={{ maxWidth: 1400, margin: '24px auto 0', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.1)', fontSize: 11, textAlign: 'center' }}>
        © {new Date().getFullYear()} PLATFORMA. Все права защищены.
      </div>
    </footer>
  )
}
