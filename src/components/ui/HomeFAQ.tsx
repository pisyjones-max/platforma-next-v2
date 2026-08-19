'use client'
import { useState } from 'react'
import { HOME_FAQS } from '@/lib/faq'

export function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div style={{ marginTop: 48 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--fh)', fontSize: 22, fontWeight: 800 }}>
          Частые вопросы
        </h2>
        <p style={{ margin: 0, fontSize: 14.5, color: 'var(--muted)' }}>
          Отвечаем на главные вопросы о кровельных материалах
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {HOME_FAQS.map((faq, i) => {
          const isOpen = open === i
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
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12,
                  padding: '16px 20px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{
                  fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, flex: 1,
                }}>
                  {faq.q}
                </span>
                <span style={{
                  fontSize: 18, color: isOpen ? '#7ecc9a' : 'var(--muted)',
                  transition: 'transform .25s, color .2s',
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  flexShrink: 0, lineHeight: 1,
                }}>+</span>
              </button>

              <div style={{
                maxHeight: isOpen ? 400 : 0,
                overflow: 'hidden',
                transition: 'max-height .3s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <div style={{
                  padding: '0 20px 18px',
                  fontSize: 14.5,
                  lineHeight: 1.75,
                  color: 'var(--muted)',
                  borderTop: '1px solid var(--border)',
                  paddingTop: 14,
                  marginTop: 0,
                }}>
                  {faq.a}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        marginTop: 20,
        padding: '16px 20px',
        background: 'rgba(126,204,154,.08)',
        border: '1px solid rgba(126,204,154,.25)',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 28 }}>👷</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Не нашли ответ?</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>
            Наш специалист ответит на любой вопрос по материалам и монтажу — бесплатно.
          </div>
        </div>
        <a
          href="tel:+79332033005"
          style={{
            padding: '11px 20px',
            background: 'linear-gradient(135deg, #7ecc9a, #4caf70)',
            borderRadius: 10,
            color: '#0d1f14',
            fontWeight: 800,
            fontSize: 14.5,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          📞 Позвонить
        </a>
      </div>
    </div>
  )
}
