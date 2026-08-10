'use client'
import { useState } from 'react'
import { formatPhone } from '@/lib/phone'

export function CardIssueForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [error, setError] = useState('')
  const [bonus, setBonus] = useState(0)

  const handleSubmit = async () => {
    setError('')
    const digits = phone.replace(/\D/g, '')
    if (!name.trim()) { setError('Укажите имя'); return }
    if (digits.length < 11) { setError('Укажите корректный телефон'); return }

    setStatus('sending')
    try {
      const res = await fetch('/api/card/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'issue_failed')
      setBonus(data.bonus ?? 0)
      setStatus('ok')
    } catch {
      setStatus('error')
      setError('Не получилось оформить карту. Попробуйте ещё раз или позвоните нам.')
    }
  }

  if (status === 'ok') {
    return (
      <div style={{
        background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 16,
        padding: '28px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
        <div style={{ fontFamily: 'var(--fh)', fontSize: 17, fontWeight: 800, marginBottom: 6 }}>
          Карта оформлена
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          Скидка по карте уже действует — назовите свой телефон на кассе или при оформлении заказа на сайте.
        </div>
        {bonus > 0 && (
          <div style={{
            marginTop: 14, padding: '12px 14px', borderRadius: 12,
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}>
            <div style={{ fontFamily: 'var(--fh)', fontSize: 15, fontWeight: 800, color: 'var(--accent)' }}>
              +{bonus} ₽ бонус на карте
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
              Начислено за дизайн-проект — спишется при покупке материалов.
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
      padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <input
        placeholder="Ваше имя"
        value={name}
        onChange={e => setName(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="+7 (___) ___-__-__"
        value={phone}
        onChange={e => setPhone(formatPhone(e.target.value))}
        style={inputStyle}
      />

      {error && <div style={{ color: 'var(--accent)', fontSize: 12.5 }}>{error}</div>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={status === 'sending'}
        style={{
          marginTop: 4, padding: '13px 20px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #7ecc9a, #4caf70)', color: '#0d1f14',
          fontWeight: 800, fontSize: 14, cursor: status === 'sending' ? 'default' : 'pointer',
          opacity: status === 'sending' ? 0.7 : 1,
        }}
      >
        {status === 'sending' ? 'Оформляем…' : 'Оформить карту бесплатно'}
      </button>
      <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
        Оформление бесплатно и занимает 10 секунд. Если ранее вы оставляли заявку на
        бесплатный дизайн-проект — бонус за него автоматически появится на карте.
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid var(--border)', fontSize: 13.5, background: 'var(--surface)',
  boxSizing: 'border-box',
}
