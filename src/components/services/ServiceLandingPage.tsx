import Link from 'next/link'
import type { ServiceConfig } from '@/lib/services'
import { ServiceRequestForm } from '@/components/services/ServiceRequestForm'
import { PHONE_NUMBER } from '@/lib/constants'

export function ServiceLandingPage({ service }: { service: ServiceConfig }) {
  const telHref = `tel:${PHONE_NUMBER.replace(/[^\d+]/g, '')}`

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 20px 80px' }}>
      <nav className="breadcrumb">
        <span className="bc-item bc-link"><Link href="/">Каталог</Link></span>
        <span className="bc-sep">›</span>
        <span className="bc-item bc-cur">{service.title}</span>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', margin: '28px 0 40px' }}>
        <div style={{
          display: 'inline-block', padding: '6px 14px', borderRadius: 20,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 16,
        }}>
          🛠 Партнёрская услуга
        </div>
        <h1 style={{
          fontFamily: 'var(--fh)', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800,
          lineHeight: 1.25, marginBottom: 14,
        }}>
          {service.heroTitle}
        </h1>
        <p style={{ fontSize: 15.5, color: 'var(--muted)', maxWidth: 620, margin: '0 auto' }}>
          {service.heroSubtitle}
        </p>
      </div>

      {/* Как это работает */}
      <h2 className="prod-section-title" style={{ marginBottom: 18 }}>Как это работает</h2>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, marginBottom: 48,
      }}>
        {service.steps.map((step, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '18px 16px',
          }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{step.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>{step.title}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{step.text}</div>
          </div>
        ))}
      </div>

      {/* Форма + телефон */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 20, maxWidth: 520, margin: '0 auto 48px' }}>
        <ServiceRequestForm serviceSlug={service.slug} ctaText="Оставить заявку на монтаж" />
        <div style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--muted)' }}>
          Или позвоните напрямую: <a href={telHref} style={{ color: 'var(--dark)', fontWeight: 700 }}>{PHONE_NUMBER}</a>
        </div>
      </div>

      {/* Дисклеймер о партнёрской модели */}
      <div style={{
        background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12,
        padding: '14px 16px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 48,
      }}>
        PLATFORMA продаёт строительные материалы и передаёт заявки на монтаж проверенным партнёрам,
        работающим в Раменском округе. Монтажные работы выполняет партнёр — с ним вы напрямую
        согласовываете стоимость, сроки и гарантию на работы.
      </div>

      {/* FAQ */}
      <h2 className="prod-section-title" style={{ marginBottom: 14 }}>Вопросы и ответы</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {service.faq.map((item, i) => (
          <details key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '14px 16px',
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14.5 }}>{item.q}</summary>
            <p style={{ marginTop: 8, fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
