'use client'
import { useState, useRef } from 'react'
import { formatPhone } from '@/lib/phone'

const MAX_PHOTOS = 3

export function PriceMatchForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [product, setProduct] = useState('')
  const [competitorPrice, setCompetitorPrice] = useState('')
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const next = [...files, ...Array.from(list)].slice(0, MAX_PHOTOS)
    setFiles(next)
    setPreviews(next.map(f => URL.createObjectURL(f)))
  }

  const removeFile = (i: number) => {
    const next = files.filter((_, idx) => idx !== i)
    setFiles(next)
    setPreviews(next.map(f => URL.createObjectURL(f)))
  }

  const handleSubmit = async () => {
    setError('')
    const digits = phone.replace(/\D/g, '')
    if (!name.trim()) { setError('Укажите имя'); return }
    if (digits.length < 11) { setError('Укажите корректный телефон'); return }
    if (!product.trim()) { setError('Укажите, какой товар нужен'); return }

    setStatus('sending')
    try {
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append('phone', phone)
      fd.append('product', product.trim())
      fd.append('competitorPrice', competitorPrice.trim())
      fd.append('comment', comment.trim())
      files.forEach(f => fd.append('photos', f))

      const res = await fetch('/api/price-match', { method: 'POST', body: fd })
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
          Наш менеджер сверит цену конкурента и перезвонит с предложением в течение рабочего дня.
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
        placeholder="Какой товар нужен (название, размер)"
        value={product}
        onChange={e => setProduct(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="Цена у конкурента, ₽ (необязательно)"
        value={competitorPrice}
        onChange={e => setCompetitorPrice(e.target.value)}
        style={inputStyle}
      />

      <textarea
        placeholder="Комментарий (необязательно): ссылка на товар конкурента, нужное количество"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
      />

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
          Скриншот прайса или КП конкурента (до {MAX_PHOTOS} шт.)
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {previews.map((src, i) => (
            <div key={i} style={{ position: 'relative', width: 64, height: 64 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
              <button
                type="button"
                onClick={() => removeFile(i)}
                style={{
                  position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--accent)', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
          ))}
          {files.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                width: 64, height: 64, borderRadius: 8, border: '1.5px dashed var(--border)',
                background: 'var(--surface2)', color: 'var(--muted)', fontSize: 22, cursor: 'pointer',
              }}
            >
              +
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {error && <div style={{ color: 'var(--accent)', fontSize: 13.5 }}>{error}</div>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={status === 'sending'}
        style={{
          marginTop: 4, padding: '13px 20px', borderRadius: 12, border: 'none',
          background: 'var(--gold)', color: '#241a03',
          fontWeight: 800, fontSize: 15, cursor: status === 'sending' ? 'default' : 'pointer',
          opacity: status === 'sending' ? 0.7 : 1,
        }}
      >
        {status === 'sending' ? 'Отправляем…' : 'Прислать цену конкурента'}
      </button>
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
        Скриншот или файл прайса не обязателен, но с ним мы быстрее сверим цену
        и точнее посчитаем скидку минимум −5% от цены конкурента.
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid var(--border)', fontSize: 14.5, background: 'var(--surface)',
  boxSizing: 'border-box',
}
