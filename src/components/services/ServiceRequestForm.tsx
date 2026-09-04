'use client'
import { useState } from 'react'
import { formatPhone } from '@/lib/phone'

interface Props {
  serviceSlug: string
  ctaText: string
}

export function ServiceRequestForm({ serviceSlug, ctaText }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    const digits = phone.replace(/\D/g, '')
    if (!name.trim()) { setError('Укажите имя'); return }
    if (digits.length < 11) { setError('Укажите корректный телефон'); return }

    setStatus('sending')
    try {
      const res = await fetch('/api/service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: serviceSlug,
          name: name.trim(),
          phone,
          address: address.trim(),
          comment: comment.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'send_failed')
      setStatus('ok')
    } catch {
      setStatus('error')
      setError('Не получилось отправить. Попробуйте ещё раз или позвоните нам.')
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
          Заявка отправлена
        </div>
        <div style={{ fontSize: 14.5, color: 'var(--muted)' }}>
          Передадим её монтажному партнёру — он свяжется с вами в ближайшее время для замера и расчёта.
        </div>
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
        placeholder="Адрес объекта (город, улица) — необязательно"
        value={address}
        onChange={e => setAddress(e.target.value)}
        style={inputStyle}
      />
      <textarea
        placeholder="Комментарий: площадь, материал, сроки — необязательно"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
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
        {status === 'sending' ? 'Отправляем…' : ctaText}
      </button>
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
        Оставляя заявку, вы соглашаетесь на передачу контактов монтажному партнёру PLATFORMA
        для связи с вами по вашей заявке.
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid var(--border)', fontSize: 14.5, background: 'var(--surface)',
  boxSizing: 'border-box',
}
