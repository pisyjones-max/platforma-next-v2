'use client'
import { useState, useEffect, useCallback } from 'react'

interface Lead {
  id: string
  kind: 'order' | 'callback'
  createdAt: string
  tgDelivered: boolean
  form?: { name?: string; phone?: string; email?: string; address?: string; pvzAddress?: string; comment?: string; deliveryMethod?: string }
  items?: { title: string; qty: number; price: number }[]
  total?: number
  phone?: string
  note?: string
}

const LS_ADMIN_KEY = 'platforma_admin_key'
const rub = (n: number) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽'
const when = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function AdminOrdersPage() {
  const [key, setKey] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [sources, setSources] = useState<{ file: boolean; kv: boolean } | null>(null)
  const [onlyLost, setOnlyLost] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(LS_ADMIN_KEY)
    if (saved) setKey(saved)
  }, [])

  const load = useCallback(async (k: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/orders', { headers: { 'x-admin-key': k }, cache: 'no-store' })
      if (res.status === 401) {
        setError('Неверный ключ')
        localStorage.removeItem(LS_ADMIN_KEY)
        setKey('')
        return
      }
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Ошибка загрузки'); return }
      setLeads(data.leads)
      setSources(data.sources)
    } catch {
      setError('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (key) load(key) }, [key, load])

  const unlock = () => {
    if (!keyInput.trim()) return
    localStorage.setItem(LS_ADMIN_KEY, keyInput.trim())
    setKey(keyInput.trim())
  }

  if (!key) {
    return (
      <div style={{ maxWidth: 380, margin: '80px auto', padding: '0 16px', fontFamily: 'var(--fb, sans-serif)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Заказы PLATFORMA</h1>
        <input
          type="password"
          placeholder="Ключ доступа"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && unlock()}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 8, marginBottom: 10 }}
        />
        <button onClick={unlock} style={{ width: '100%', padding: '10px 12px', background: '#192C1E', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Войти
        </button>
        {error && <div style={{ color: '#BF3E22', fontSize: 14, marginTop: 8 }}>{error}</div>}
      </div>
    )
  }

  const shown = (leads ?? []).filter(l => !onlyLost || !l.tgDelivered)
  const lost = (leads ?? []).filter(l => !l.tgDelivered).length

  return (
    <div style={{ maxWidth: 640, margin: '24px auto', padding: '0 12px', fontFamily: 'var(--fb, sans-serif)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Заказы и заявки</h1>
      <div style={{ fontSize: 12.5, color: '#888', marginBottom: 12 }}>
        Всего: {leads?.length ?? 0} · не дошли в Telegram: <b style={{ color: lost ? '#BF3E22' : 'inherit' }}>{lost}</b>
        {sources && <> · источники: файл {sources.file ? '✓' : '—'}, KV {sources.kv ? '✓' : '—'}</>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button onClick={() => load(key)} disabled={loading} style={{ padding: '8px 14px', background: '#192C1E', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {loading ? 'Загрузка…' : 'Обновить'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <input type="checkbox" checked={onlyLost} onChange={e => setOnlyLost(e.target.checked)} />
          только не дошедшие в TG
        </label>
      </div>

      {error && <div style={{ color: '#BF3E22', fontSize: 14, marginBottom: 12 }}>{error}</div>}
      {leads && shown.length === 0 && !loading && <div style={{ fontSize: 14, color: '#888' }}>Пока пусто.</div>}

      {shown.map(l => {
        const phone = l.kind === 'order' ? l.form?.phone : l.phone
        return (
          <div key={l.id} style={{ border: '1px solid #e2e2e2', borderLeft: `4px solid ${l.tgDelivered ? '#1a7a3d' : '#BF3E22'}`, borderRadius: 8, padding: '10px 12px', marginBottom: 10, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, color: '#888', marginBottom: 4 }}>
              <span>{l.kind === 'order' ? '🛒 Заказ' : '📞 Заявка'} · {when(l.createdAt)}</span>
              <span style={{ color: l.tgDelivered ? '#1a7a3d' : '#BF3E22', fontWeight: 600 }}>{l.tgDelivered ? 'в TG доставлен' : 'В TG НЕ дошёл'}</span>
            </div>
            {l.kind === 'order' ? (
              <>
                <div><b>{l.form?.name || '—'}</b> · {phone ? <a href={`tel:${phone}`}>{phone}</a> : '—'}</div>
                {l.form?.email && <div style={{ color: '#666' }}>{l.form.email}</div>}
                <div style={{ color: '#666' }}>
                  {l.form?.deliveryMethod === 'pvz' ? `ПВЗ: ${l.form?.pvzAddress || '—'}` : `Курьер: ${l.form?.address || '—'}`}
                </div>
                <ul style={{ margin: '6px 0', paddingLeft: 18 }}>
                  {(l.items ?? []).map((i, idx) => <li key={idx}>{i.title} × {i.qty} = {rub(i.price * i.qty)}</li>)}
                </ul>
                <div><b>Сумма: {rub(l.total ?? 0)}</b></div>
                {l.form?.comment && <div style={{ color: '#666' }}>💬 {l.form.comment}</div>}
              </>
            ) : (
              <>
                <div>{phone ? <a href={`tel:${phone}`}><b>{phone}</b></a> : '—'}</div>
                {l.note && <div style={{ color: '#666', whiteSpace: 'pre-wrap' }}>{l.note}</div>}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
