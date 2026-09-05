'use client'
import { useState } from 'react'
import { formatPhone, normalizePhone } from '@/lib/phone'

export function CardIssueForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [error, setError] = useState('')
  const [bonus, setBonus] = useState(0)
  const [referralBonus, setReferralBonus] = useState(0)
  const [ref] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('ref')
  )
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)

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
        body: JSON.stringify({ name: name.trim(), phone, ref, email: email.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'issue_failed')
      setBonus(data.bonus ?? 0)
      setReferralBonus(data.referralBonus ?? 0)
      const p = normalizePhone(phone)
      if (p) setShareLink(`${window.location.origin}/loyalty-card?ref=${p}`)
      setStatus('ok')
    } catch {
      setStatus('error')
      setError('Не получилось оформить карту. Попробуйте ещё раз или позвоните нам.')
    }
  }

  const copyLink = () => {
    navigator.clipboard?.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        <div style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          Скидка по карте уже действует — назовите свой телефон на кассе или при оформлении заказа на сайте.
        </div>
        {bonus > 0 && (
          <div style={{
            marginTop: 14, padding: '12px 14px', borderRadius: 12,
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}>
            <div style={{ fontFamily: 'var(--fh)', fontSize: 15.5, fontWeight: 800, color: 'var(--accent)' }}>
              +{bonus} ₽ бонус на карте
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
              Начислено за дизайн-проект — спишется при покупке материалов.
            </div>
          </div>
        )}
        {referralBonus > 0 && (
          <div style={{
            marginTop: 14, padding: '12px 14px', borderRadius: 12,
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}>
            <div style={{ fontFamily: 'var(--fh)', fontSize: 15.5, fontWeight: 800, color: 'var(--accent)' }}>
              +{referralBonus.toLocaleString('ru-RU')} баллов за приглашение
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
              Тот, кто вас пригласил, тоже получил бонус — теперь ваша очередь приглашать соседей.
            </div>
          </div>
        )}
        {shareLink && (
          <div style={{
            marginTop: 14, padding: '14px', borderRadius: 12,
            background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'left',
          }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>
              Поделитесь с соседями по СНТ/посёлку
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5 }}>
              Каждый, кто оформит карту по вашей ссылке, приносит вам бонусные баллы.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={shareLink} style={{ ...inputStyle, fontSize: 12.5, flex: 1 }} onFocus={e => e.target.select()} />
              <button
                type="button"
                onClick={copyLink}
                style={{
                  padding: '0 14px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #7ecc9a, #4caf70)', color: '#0d1f14',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {copied ? '✓ Скопировано' : 'Копировать'}
              </button>
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
      <input
        placeholder="Email (необязательно)"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={inputStyle}
      />

      {error && <div style={{ color: 'var(--accent)', fontSize: 13.5 }}>{error}</div>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={status === 'sending'}
        style={{
          marginTop: 4, padding: '13px 20px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #7ecc9a, #4caf70)', color: '#0d1f14',
          fontWeight: 800, fontSize: 15, cursor: status === 'sending' ? 'default' : 'pointer',
          opacity: status === 'sending' ? 0.7 : 1,
        }}
      >
        {status === 'sending' ? 'Оформляем…' : 'Оформить карту бесплатно'}
      </button>
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
        Оформление бесплатно и занимает 10 секунд. Если ранее вы оставляли заявку на
        бесплатный дизайн-проект — бонус за него автоматически появится на карте.
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid var(--border)', fontSize: 14.5, background: 'var(--surface)',
  boxSizing: 'border-box',
}
