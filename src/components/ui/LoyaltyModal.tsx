'use client'
import { useState } from 'react'
import { useUI } from '@/context/UIContext'
import { useCard } from '@/context/CardContext'
import { PHONE_NUMBER } from '@/lib/constants'
import { formatPhone } from '@/lib/phone'

export function LoyaltyModal() {
  const { loyaltyOpen, closeLoyalty } = useUI()
  const { markVerified } = useCard()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!loyaltyOpen) return null

  const handleSubmit = async () => {
    if (!name || !phone) { alert('Заполните имя и телефон'); return }
    setLoading(true)
    await Promise.all([
      fetch('/api/order/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, product: `Карта лояльности PLATFORMA — ${name}`, type: 'loyalty' }),
      }),
      fetch('/api/card/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      }),
    ])
    markVerified(phone)
    setLoading(false)
    setSent(true)
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}
        onClick={closeLoyalty} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 801,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
        <div className="loyalty-modal">
          {/* Шапка карты */}
          <div className="lc-hdr">
            <button className="lc-hdr-close" onClick={closeLoyalty}>✕</button>
            <div className="lc-hdr-title">Карта лояльности PLATFORMA</div>
            <div className="lc-hdr-sub">Кэшбэк до 5% • Скидки постоянным клиентам</div>
          </div>

          {/* Визуализация карты */}
          <div style={{ padding: '20px 24px 0' }}>
            <div className="lc-card">
              <div className="lc-top">
                <div>
                  <div className="lc-logo">PLAT<em>FORMA</em></div>
                  <div className="lc-type">Карта лояльности</div>
                </div>
                <div className="lc-chip">💳</div>
              </div>
              <div className="lc-number">•••• •••• •••• ????</div>
              <div className="lc-bottom">
                <div>
                  <div className="lc-balance-lbl">Начальный бонус</div>
                  <div className="lc-balance">5 000 ₽</div>
                  <div className="lc-balance-sub">бонусных рублей</div>
                </div>
                <div className="lc-stats">
                  <div className="lc-stat-item">
                    <div className="lc-stat-val">0.5%</div>
                    <div className="lc-stat-lbl">Кэшбэк</div>
                  </div>
                  <div className="lc-stat-item">
                    <div className="lc-stat-val">−17%</div>
                    <div className="lc-stat-lbl">Скидка</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lc-body">
            {/* Преимущества */}
            <div className="lc-section">
              <div className="lc-section-title">Что вы получаете</div>
              <div className="lc-perks">
                {[
                  { icon: '🎁', title: '5 000 ₽ бонусами', text: 'Сразу при оформлении карты' },
                  { icon: '💰', title: 'Кэшбэк 0.5%', text: 'С каждой покупки на карту' },
                  { icon: '🏷️', title: 'Скидка −17%', text: 'На весь ассортимент магазина' },
                  { icon: '🚀', title: 'Приоритет', text: 'Первыми узнаёте об акциях' },
                ].map((p, i) => (
                  <div key={i} style={{
                    background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{p.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 3 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Форма */}
            {sent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
                <div style={{ fontFamily: 'var(--fh)', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                  Заявка принята!
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Менеджер свяжется с вами и оформит карту.<br />
                  Бонус 5 000 ₽ будет начислен сразу!
                </div>
                <button className="co-submit" style={{ marginTop: 20 }} onClick={closeLoyalty}>Отлично!</button>
              </div>
            ) : (
              <div className="lc-section">
                <div className="lc-section-title">Оформить карту бесплатно</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="finp-wrap">
                    <label>Ваше имя</label>
                    <input className="finp" placeholder="Иван Иванов" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="finp-wrap">
                    <label>Телефон</label>
                    <input className="finp" placeholder="+7 (___) ___-__-__" value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))} inputMode="tel" />
                  </div>
                  <button className="co-submit" onClick={handleSubmit} disabled={loading}
                    style={{ background: 'var(--dark)' }}>
                    {loading ? 'Отправка...' : '🎁 Получить карту + 5 000 ₽'}
                  </button>
                  <p className="privacy-note" style={{ textAlign: 'center' }}>
                    Нажимая кнопку, вы соглашаетесь с{' '}
                    <a href="/privacy" target="_blank">политикой обработки данных</a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
