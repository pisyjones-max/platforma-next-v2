'use client'
import { useState, useEffect } from 'react'
import { useUI } from '@/context/UIContext'

export function ExitIntentModal() {
  const { exitOpen, closeExit, openLoyalty, openConsult } = useUI()
  const [seconds, setSeconds] = useState(600) // 10 минут "до конца акции"
  const [tab, setTab] = useState<'bonus' | 'callback'>('bonus')
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)

  // Таймер обратного отсчёта пока модалка открыта
  useEffect(() => {
    if (!exitOpen) return
    setSeconds(600)
    const iv = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(iv)
  }, [exitOpen])

  if (!exitOpen) return null

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  const handleCallback = async () => {
    if (!phone.trim()) return
    await fetch('/api/order/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, product: 'Запрос с exit-intent модалки' }),
    })
    setSent(true)
  }

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(6px)' }}
        onClick={closeExit}
      />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 901,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
        <div style={{
          background: 'var(--surface)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 440,
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,.45)',
          animation: 'mIn .35s cubic-bezier(.34,1.2,.64,1)',
        }}>
          {/* Шапка */}
          <div style={{
            background: 'linear-gradient(135deg, #1a3828 0%, #2d5a3d 100%)',
            padding: '28px 24px 22px',
            textAlign: 'center',
            position: 'relative',
            color: '#fff',
          }}>
            <button onClick={closeExit} style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(255,255,255,.15)', border: 'none', color: 'rgba(255,255,255,.8)',
              width: 30, height: 30, borderRadius: '50%', fontSize: 15, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>

            <div style={{ fontSize: 46, marginBottom: 8 }}>🛑</div>
            <div style={{ fontFamily: 'var(--fh)', fontSize: 22, fontWeight: 800, marginBottom: 6, lineHeight: 1.2 }}>
              Подождите! Уходите без скидки?
            </div>
            <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.55 }}>
              Только сейчас для вас действует спецпредложение
            </div>

            {/* Таймер */}
            <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,0,0,.3)', borderRadius: 12, padding: '8px 18px' }}>
              <span style={{ fontSize: 11, opacity: 0.7, letterSpacing: 0.5 }}>ПРЕДЛОЖЕНИЕ ИСТЕКАЕТ ЧЕРЕЗ</span>
              <span style={{
                fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: '#7ecc9a',
                letterSpacing: 2,
              }}>{mm}:{ss}</span>
            </div>
          </div>

          {/* Табы */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {(['bonus', 'callback'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '13px 0',
                background: tab === t ? 'var(--surface)' : 'var(--surface2)',
                border: 'none', borderBottom: tab === t ? '2px solid #7ecc9a' : '2px solid transparent',
                color: tab === t ? 'var(--text)' : 'var(--muted)',
                fontWeight: tab === t ? 700 : 400,
                fontSize: 13, cursor: 'pointer', transition: 'all .15s',
              }}>
                {t === 'bonus' ? '🎁 Бонусная карта' : '📞 Перезвоните мне'}
              </button>
            ))}
          </div>

          <div style={{ padding: '22px 24px 24px' }}>
            {tab === 'bonus' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {[
                    { icon: '💳', text: '5 000 ₽ бонусными рублями — сразу на счёт' },
                    { icon: '🏷️', text: 'Скидка −17% на весь ассортимент навсегда' },
                    { icon: '📦', text: 'Кэшбэк 0.5% с каждой покупки' },
                    { icon: '🔧', text: 'Бесплатный выезд замерщика' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { closeExit(); openLoyalty() }}
                  style={{
                    width: '100%', height: 52, borderRadius: 12,
                    background: 'linear-gradient(135deg, #7ecc9a 0%, #4caf70 100%)',
                    color: '#0d1f14', border: 'none',
                    fontSize: 15, fontWeight: 800, cursor: 'pointer',
                    transition: 'filter .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  🎁 Получить 5 000 ₽ бонусами
                </button>
              </>
            )}

            {tab === 'callback' && (
              <>
                {sent ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Заявка принята!</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>Перезвоним в течение 15 минут</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
                      Оставьте номер — менеджер перезвонит, ответит на вопросы и зафиксирует для вас цену.
                    </div>
                    <input
                      className="finp"
                      placeholder="+7 (___) ___-__-__"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      style={{ marginBottom: 12, width: '100%', boxSizing: 'border-box' }}
                    />
                    <button
                      onClick={handleCallback}
                      style={{
                        width: '100%', height: 52, borderRadius: 12,
                        background: 'linear-gradient(135deg, #7ecc9a 0%, #4caf70 100%)',
                        color: '#0d1f14', border: 'none',
                        fontSize: 15, fontWeight: 800, cursor: 'pointer',
                      }}
                    >
                      📞 Перезвоните мне
                    </button>
                    <p style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>
                      Нажимая кнопку, вы соглашаетесь с обработкой персональных данных (ФЗ-152)
                    </p>
                  </>
                )}
              </>
            )}

            <button onClick={closeExit} style={{
              width: '100%', marginTop: 10, padding: '8px 0',
              background: 'none', border: 'none',
              fontSize: 12, color: 'var(--muted)', cursor: 'pointer', opacity: 0.65,
            }}>
              Продолжить без скидки
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
