import type { Metadata } from 'next'
import Link from 'next/link'
import { CardIssueForm } from '@/components/loyalty/CardIssueForm'
import { CARD_WELCOME_BONUS, PHONE_NUMBER } from '@/lib/constants'
import { CASHBACK_TIERS, REFERRAL_BONUS_POINTS, REVIEW_BONUS_MIN, REVIEW_BONUS_MAX } from '@/lib/loyaltyFeatures'
import { CITIES } from '@/lib/cities'
import { SERVICES } from '@/lib/services'

export const metadata: Metadata = {
  title: 'Клуб соседей — Раменский округ | PLATFORMA',
  description:
    `Клуб соседей PLATFORMA: ${CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов сразу, растущий кэшбэк, бонусы за приглашённых соседей. Для тех, кто строится и ремонтирует дом в Раменском округе — Раменское, Гжель, Воскресенск, Бронницы, Жуковский и рядом.`,
}

export default function SosediPage() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px 90px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{
          display: 'inline-block', padding: '6px 14px', borderRadius: 20,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 16,
        }}>
          🏡 Клуб соседей
        </div>
        <h1 style={{
          fontFamily: 'var(--fh)', fontSize: 'clamp(26px, 4.2vw, 42px)', fontWeight: 800,
          lineHeight: 1.2, marginBottom: 14,
        }}>
          Свои условия для тех,<br />кто строится рядом
        </h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 640, margin: '0 auto' }}>
          Не разовая акция, а карта для всех, кто строит и ремонтирует дом в Раменском
          округе. {CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов сразу, кэшбэк растёт
          с каждой покупкой, а за приглашённого соседа — отдельный бонус.
        </p>
      </div>

      {/* Форма — сразу под хироем, чтобы не листать до конца */}
      <div style={{ maxWidth: 420, margin: '0 auto 56px' }}>
        <CardIssueForm />
      </div>

      {/* Что даёт карта */}
      <h2 className="prod-section-title" style={{ marginBottom: 18, textAlign: 'center' }}>
        Что входит в клуб
      </h2>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14, marginBottom: 56,
      }}>
        {[
          {
            icon: '🎁',
            title: `${CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов при вступлении`,
            text: 'Начисляются сразу, независимо от того, готовы ли вы покупать материалы прямо сейчас.',
          },
          {
            icon: '📈',
            title: `Кэшбэк ${(CASHBACK_TIERS[0] * 100).toFixed(1)}% → ${(CASHBACK_TIERS[CASHBACK_TIERS.length - 1] * 100).toFixed(1)}%`,
            text: 'Растёт с каждой следующей покупкой — чем больше строите, тем выгоднее.',
          },
          {
            icon: '🤝',
            title: `+${REFERRAL_BONUS_POINTS.toLocaleString('ru-RU')} баллов за соседа`,
            text: 'Своя ссылка появится сразу после оформления — поделитесь с теми, кто тоже строится.',
          },
          {
            icon: '⭐',
            title: `${REVIEW_BONUS_MIN}–${REVIEW_BONUS_MAX} баллов за отзыв`,
            text: 'Пришлите фото или видео своей готовой кровли, фасада или забора — начислим бонус.',
          },
        ].map((b, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '18px 16px',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{b.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>{b.title}</div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>{b.text}</div>
          </div>
        ))}
      </div>

      {/* Гео — кто входит в "соседей" */}
      <h2 className="prod-section-title" style={{ marginBottom: 8, textAlign: 'center' }}>
        Кто такие соседи
      </h2>
      <p style={{ fontSize: 14.5, color: 'var(--muted)', textAlign: 'center', maxWidth: 620, margin: '0 auto 24px' }}>
        Клуб открыт для всех, кто строится в Раменском округе и рядом — не только в самом Раменском.
      </p>
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 56,
      }}>
        {CITIES.map(c => (
          <span key={c.slug} style={{
            padding: '8px 16px', borderRadius: 20, background: 'var(--surface2)',
            border: '1px solid var(--border)', fontSize: 13.5, fontWeight: 600,
          }}>
            {c.name}
          </span>
        ))}
      </div>

      {/* Сервис соседей — партнёрские услуги */}
      <h2 className="prod-section-title" style={{ marginBottom: 8, textAlign: 'center' }}>
        Не только материалы
      </h2>
      <p style={{ fontSize: 14.5, color: 'var(--muted)', textAlign: 'center', maxWidth: 640, margin: '0 auto 24px' }}>
        Держатели карты в приоритете получают заявки на монтаж и другие работы —
        мы передаём их проверенным партнёрам в вашем районе.
      </p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12, marginBottom: 20,
      }}>
        {SERVICES.map(s => (
          <Link key={s.slug} href={s.urlPath} style={{
            display: 'block', padding: '16px', borderRadius: 12,
            background: 'var(--surface)', border: '1px solid var(--border)',
            fontSize: 14, fontWeight: 700, textDecoration: 'none', color: 'inherit',
          }}>
            {s.title} →
          </Link>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', marginBottom: 56 }}>
        Подбор партнёра для клиента бесплатный. Стоимость и сроки работ определяет партнёр.
      </p>

      <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
        Вопросы по карте — {PHONE_NUMBER}. Подробные условия и FAQ —{' '}
        <Link href="/loyalty-card" style={{ color: 'inherit', textDecoration: 'underline' }}>
          на странице карты лояльности
        </Link>.
      </p>
    </div>
  )
}
