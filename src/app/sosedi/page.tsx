import type { Metadata } from 'next'
import { CardIssueForm } from '@/components/loyalty/CardIssueForm'
import { CARD_WELCOME_BONUS, PHONE_NUMBER } from '@/lib/constants'
import { CASHBACK_TIERS, REFERRAL_BONUS_POINTS, REVIEW_BONUS_MIN, REVIEW_BONUS_MAX } from '@/lib/loyaltyFeatures'
import { CITIES } from '@/lib/cities'

export const metadata: Metadata = {
  title: `${CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов на стройку — Клуб соседей PLATFORMA`,
  description:
    `Бесплатная карта клуба соседей PLATFORMA: ${CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов сразу, кэшбэк растёт с каждой покупкой. Только для тех, кто строится в Раменском округе.`,
  robots: { index: false, follow: false }, // рекламный лендинг, не для органической выдачи — не дублировать /loyalty-card в индексе
}

const BRAND_LOGOS = [
  'tehnonikol.svg', 'knauf.svg', 'rockwool.jpg', 'grand-line.png',
  'metallprofil.png', 'docke.png', 'velux.png', 'cedral.svg',
]

export default function SosediPage() {
  const maxCashback = (CASHBACK_TIERS[CASHBACK_TIERS.length - 1] * 100).toFixed(1)

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100vh', color: '#fff' }}>
      {/* ===== HERO — оффер + форма без прокрутки ===== */}
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 20px 44px' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{
            display: 'inline-block', padding: '5px 14px', borderRadius: 20,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3, color: 'var(--gold)',
          }}>
            ТОЛЬКО ДЛЯ РАМЕНСКОГО ОКРУГА
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--fh)', fontSize: 'clamp(30px, 5.5vw, 52px)', fontWeight: 800,
          lineHeight: 1.08, textAlign: 'center', margin: '18px 0 12px',
        }}>
          {CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов на стройку —<br />
          <span style={{ color: 'var(--gold)' }}>бесплатно, за 30 секунд</span>
        </h1>
        <p style={{
          fontSize: 16, color: 'rgba(255,255,255,0.65)', textAlign: 'center',
          maxWidth: 560, margin: '0 auto 32px',
        }}>
          Карта клуба соседей PLATFORMA. Баллы начисляются сразу, покупать
          прямо сейчас не обязательно.
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 28,
          alignItems: 'center', maxWidth: 900, margin: '0 auto',
        }} className="sosedi-hero-grid">
          {/* SVG-мокап карты */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg viewBox="0 0 340 210" width="100%" style={{ maxWidth: 360 }}>
              <defs>
                <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2a4230" />
                  <stop offset="100%" stopColor="#0f1f14" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="336" height="206" rx="18" fill="url(#cardGrad)" stroke="rgba(200,150,12,0.4)" />
              <circle cx="300" cy="40" r="70" fill="rgba(200,150,12,0.06)" />
              <text x="26" y="42" fill="#fff" fontSize="15" fontWeight="800" fontFamily="sans-serif" letterSpacing="1">
                PLATFORMA
              </text>
              <text x="26" y="60" fill="var(--gold)" fontSize="10.5" fontWeight="700" fontFamily="sans-serif" letterSpacing="1.5">
                КЛУБ СОСЕДЕЙ
              </text>
              <text x="26" y="130" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="sans-serif" letterSpacing="1">
                БАЛАНС
              </text>
              <text x="26" y="155" fill="#fff" fontSize="26" fontWeight="800" fontFamily="sans-serif">
                {CARD_WELCOME_BONUS.toLocaleString('ru-RU')} б.
              </text>
              <text x="26" y="188" fill="rgba(255,255,255,0.55)" fontSize="11" fontFamily="sans-serif" letterSpacing="2">
                •••• •••• •••• 0000
              </text>
            </svg>
          </div>

          {/* Форма */}
          <div id="form">
            <div style={{ background: '#fff', borderRadius: 18, padding: '22px', color: 'var(--text)' }}>
              <CardIssueForm ctaLabel={`Забрать ${CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов`} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== Соцдоказательство ===== */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '20px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
            Материалы 76 проверенных брендов — по этой же карте
          </p>
          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 24,
            opacity: 0.75,
          }}>
            {BRAND_LOGOS.map(f => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={f} src={`/logos/${f}`} alt="" height={22} style={{ height: 22, width: 'auto', filter: 'grayscale(1) brightness(2)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* ===== Крупные цифры ===== */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '44px 20px 8px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14,
        }}>
          {[
            { val: `${CARD_WELCOME_BONUS.toLocaleString('ru-RU')}`, unit: 'баллов', label: 'сразу при вступлении' },
            { val: `до ${maxCashback}%`, unit: '', label: 'кэшбэк с каждой покупки' },
            { val: `+${REFERRAL_BONUS_POINTS.toLocaleString('ru-RU')}`, unit: 'баллов', label: 'за приглашённого соседа' },
            { val: `${REVIEW_BONUS_MIN}–${REVIEW_BONUS_MAX}`, unit: 'баллов', label: 'за фото-отзыв о вашей стройке' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, padding: '22px 16px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--fh)', fontSize: 28, fontWeight: 800, color: 'var(--gold)' }}>
                {s.val}{s.unit && <span style={{ fontSize: 15, marginLeft: 4 }}>{s.unit}</span>}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Эксклюзивность — гео ===== */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '44px 20px 8px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--fh)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          Карта доступна жителям 11 населённых пунктов
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
          Не всему интернету — только тем, кто реально строится рядом
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {CITIES.map(c => (
            <span key={c.slug} style={{
              padding: '7px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)', fontSize: 13, fontWeight: 600,
            }}>
              {c.name}
            </span>
          ))}
        </div>
      </div>

      {/* ===== Возражения — банковский стиль, коротко ===== */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '44px 20px 8px' }}>
        <h2 style={{ fontFamily: 'var(--fh)', fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 20 }}>
          Коротко
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Это платно?', 'Нет, бесплатно навсегда. Ни выпуск, ни обслуживание карты ничего не стоят.'],
            ['Нужно сразу что-то покупать?', 'Нет. Баллы начисляются в момент оформления, покупать материалы можно позже, когда будете готовы.'],
            ['Это развод, обяжут что-то купить?', 'Нет. Никаких обязательств и скрытых условий — карта либо используется, либо просто лежит без дела.'],
            ['Как получить баллы на руки?', 'Баллы привязаны к номеру телефона — на кассе или при заказе на сайте достаточно назвать телефон, менеджер применит скидку.'],
          ].map(([q, a], i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '14px 16px',
            }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>{q}</div>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Финальный CTA ===== */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 20px 80px', textAlign: 'center' }}>
        <a href="#form" style={{
          display: 'inline-block', width: '100%', padding: '16px 24px', borderRadius: 14,
          background: 'var(--gold)', color: '#1a1408', fontFamily: 'var(--fh)',
          fontWeight: 800, fontSize: 16, textDecoration: 'none',
        }}>
          Забрать {CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов →
        </a>
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginTop: 14 }}>
          Вопросы — {PHONE_NUMBER}
        </p>
      </div>

      {/* Липкая CTA-плашка снизу на мобильном */}
      <div style={{
        position: 'sticky', bottom: 0, left: 0, right: 0, padding: '10px 16px',
        background: 'rgba(15,31,20,0.95)', backdropFilter: 'blur(6px)',
        borderTop: '1px solid rgba(255,255,255,0.1)', zIndex: 50,
      }} className="sosedi-sticky-cta">
        <a href="#form" style={{
          display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12,
          background: 'var(--gold)', color: '#1a1408', fontWeight: 800, fontSize: 14.5, textDecoration: 'none',
        }}>
          Забрать {CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов
        </a>
      </div>

      <style>{`
        @media (min-width: 720px) {
          .sosedi-sticky-cta { display: none; }
        }
        @media (max-width: 719px) {
          .sosedi-hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
