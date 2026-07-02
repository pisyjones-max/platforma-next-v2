'use client'
import { useState, useEffect, useCallback } from 'react'
import { formatPhone } from '@/lib/phone'

interface CardRow {
  phone: string
  name?: string
  issuedAt?: number
  source?: string
}

const LS_ADMIN_KEY = 'platforma_admin_key'

export default function AdminCardsPage() {
  const [key, setKey] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [cards, setCards] = useState<CardRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(LS_ADMIN_KEY)
    if (saved) setKey(saved)
  }, [])

  const loadCards = useCallback(async (k: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/cards', { headers: { 'x-admin-key': k } })
      if (res.status === 401) {
        setError('Неверный ключ')
        setCards(null)
        localStorage.removeItem(LS_ADMIN_KEY)
        setKey('')
        return
      }
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Ошибка загрузки'); return }
      setCards(data.cards)
    } catch {
      setError('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (key) loadCards(key)
  }, [key, loadCards])

  const handleUnlock = () => {
    if (!keyInput.trim()) return
    localStorage.setItem(LS_ADMIN_KEY, keyInput.trim())
    setKey(keyInput.trim())
  }

  const handleAdd = async () => {
    if (!phone.trim()) return
    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ name, phone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Не удалось добавить'); return }
      setName('')
      setPhone('')
      loadCards(key)
    } catch {
      setError('Ошибка сети')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (p: string) => {
    if (!confirm(`Удалить карту ${formatPhone(p)}?`)) return
    try {
      await fetch('/api/admin/cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ phone: p }),
      })
      loadCards(key)
    } catch {
      setError('Ошибка сети')
    }
  }

  if (!key) {
    return (
      <div style={{ maxWidth: 380, margin: '80px auto', padding: '0 16px', fontFamily: 'var(--fb, sans-serif)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Карты PLATFORMA — админка</h1>
        <input
          type="password"
          placeholder="Ключ доступа"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUnlock()}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 8, marginBottom: 10 }}
        />
        <button
          onClick={handleUnlock}
          style={{ width: '100%', padding: '10px 12px', background: '#192C1E', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          Войти
        </button>
        {error && <div style={{ color: '#BF3E22', fontSize: 13, marginTop: 8 }}>{error}</div>}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 16px', fontFamily: 'var(--fb, sans-serif)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Карты PLATFORMA — держатели</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          placeholder="Имя (необязательно)"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ flex: '1 1 160px', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8 }}
        />
        <input
          placeholder="+7 (___) ___-__-__"
          value={phone}
          onChange={e => setPhone(formatPhone(e.target.value))}
          style={{ flex: '1 1 180px', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8 }}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !phone.trim()}
          style={{ padding: '9px 16px', background: '#C8960C', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          {adding ? 'Добавляем…' : '+ Выдать карту'}
        </button>
      </div>

      {error && <div style={{ color: '#BF3E22', fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {loading && <div style={{ fontSize: 13, color: '#888' }}>Загрузка…</div>}

      {cards && cards.length === 0 && !loading && (
        <div style={{ fontSize: 13, color: '#888' }}>Карт пока нет.</div>
      )}

      {cards && cards.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '6px 4px' }}>Телефон</th>
              <th style={{ padding: '6px 4px' }}>Имя</th>
              <th style={{ padding: '6px 4px' }}>Источник</th>
              <th style={{ padding: '6px 4px' }}>Выдана</th>
              <th style={{ padding: '6px 4px' }}></th>
            </tr>
          </thead>
          <tbody>
            {cards.map(c => (
              <tr key={c.phone} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '6px 4px' }}>{formatPhone(c.phone)}</td>
                <td style={{ padding: '6px 4px' }}>{c.name || '—'}</td>
                <td style={{ padding: '6px 4px' }}>{c.source === 'admin' ? 'вручную' : 'сайт'}</td>
                <td style={{ padding: '6px 4px' }}>{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString('ru-RU') : '—'}</td>
                <td style={{ padding: '6px 4px' }}>
                  <button
                    onClick={() => handleRemove(c.phone)}
                    style={{ background: 'none', border: 'none', color: '#BF3E22', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
