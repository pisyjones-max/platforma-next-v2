'use client'
import { useState } from 'react'
import { useUI } from '@/context/UIContext'

function formatPhone(raw: string): string {
  let v = raw.replace(/\D/g, '')
  if (v.startsWith('8')) v = '7' + v.slice(1)
  if (v.length > 0 && !v.startsWith('7')) v = '7' + v
  v = v.slice(0, 11)
  let out = v.length > 0 ? '+7' : ''
  if (v.length > 1) out += ' (' + v.slice(1, 4)
  if (v.length >= 4) out += ') ' + v.slice(4, 7)
  if (v.length >= 7) out += '-' + v.slice(7, 9)
  if (v.length >= 9) out += '-' + v.slice(9, 11)
  return out
}

const TIME_SLOTS = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

function getNextDays(n: number) {
  const days = []
  const now = new Date()
  for (let i = 1; i <= n; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const weekday = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][d.getDay()]
    const label = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')} (${weekday})`
    days.push({ label, value: d.toISOString().slice(0, 10), disabled: d.getDay() === 0 })
  }
  return days
}

export function ConsultModal() {
  const { consultOpen, closeConsult } = useUI()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [day, setDay] = useState('')
  const [time, setTime] = useState('')
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!consultOpen) return null

  const days = getNextDays(10)

  const handleSubmit = async () => {
    if (!name || !phone) { alert('Заполните имя и телефон'); return }
    setLoading(true)
    const text = `📐 Вызов специалиста на объект\n👤 ${name}\n📞 ${phone}\n📍 ${address}\n📅 ${day} в ${time}\n💬 ${comment}`
    await fetch('/api/order/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, product: text, type: 'specialist' }),
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}
        onClick={closeConsult} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 801,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,.2)',
        }}>
          <div className="co-header">
            <span>🔧 Вызов специалиста на объект</span>
            <button onClick={closeConsult}>✕</button>
          </div>

          {sent ? (
            <div className="co-success" style={{ padding: '40px 24px' }}>
              <div className="tick">✅</div>
              <h3>Заявка принята!</h3>
              <p>Специалист приедет в указанное время.<br />Замер и консультация — <strong>бесплатно</strong>!</p>
              <button className="co-submit" style={{ marginTop: 24 }} onClick={closeConsult}>Отлично!</button>
            </div>
          ) : (
            <div className="coform">
              {/* Преимущества */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['🎯 Точный расчёт материалов', '🆓 Бесплатно', '⚡ Приедем за 1–2 дня'].map((t, i) => (
                  <div key={i} style={{
                    fontSize: 11, fontWeight: 600, background: 'var(--dark)', color: '#fff',
                    padding: '4px 10px', borderRadius: 20,
                  }}>{t}</div>
                ))}
              </div>

              <div className="frow2">
                <div className="finp-wrap">
                  <label>Ваше имя *</label>
                  <input className="finp" placeholder="Иван Иванов" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="finp-wrap">
                  <label>Телефон *</label>
                  <input className="finp" placeholder="+7 (___) ___-__-__" value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))} inputMode="tel" />
                </div>
              </div>

              <div className="finp-wrap">
                <label>Адрес объекта</label>
                <input className="finp" placeholder="г. Ногинск, ул. Примерная, д. 1" value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div className="finp-wrap">
                <label>Удобная дата</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {days.map(d => (
                    <button key={d.value} onClick={() => !d.disabled && setDay(d.value)}
                      disabled={d.disabled}
                      style={{
                        padding: '6px 10px', borderRadius: 8, fontSize: 12, border: '1.5px solid',
                        borderColor: day === d.value ? 'var(--dark)' : 'var(--border)',
                        background: day === d.value ? 'var(--dark)' : 'var(--surface2)',
                        color: day === d.value ? '#fff' : d.disabled ? 'var(--muted)' : 'var(--text)',
                        cursor: d.disabled ? 'not-allowed' : 'pointer', opacity: d.disabled ? 0.4 : 1,
                      }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="finp-wrap">
                <label>Удобное время</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {TIME_SLOTS.map(t => (
                    <button key={t} onClick={() => setTime(t)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, border: '1.5px solid',
                        borderColor: time === t ? 'var(--dark)' : 'var(--border)',
                        background: time === t ? 'var(--dark)' : 'var(--surface2)',
                        color: time === t ? '#fff' : 'var(--text)', cursor: 'pointer',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="finp-wrap">
                <label>Что нужно измерить / пожелания</label>
                <textarea className="ftarea" placeholder="Например: кровля 200 м², нужен подбор материалов..."
                  value={comment} onChange={e => setComment(e.target.value)} />
              </div>

              <button className="co-submit" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Отправка...' : '📐 Записаться на замер'}
              </button>
              <p className="privacy-note" style={{ textAlign: 'center' }}>
                Соглашаетесь с <a href="/privacy" target="_blank">политикой обработки данных</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
