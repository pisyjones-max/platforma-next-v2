'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'

type Status = 'new' | 'in_work' | 'won' | 'lost' | 'spam'
interface ViewStat { p: string; title: string; n: number; last: number; product: boolean }
interface Lead {
  vid: string; name: string; phone: string; email: string; status: Status; note: string
  firstSeen: number; lastSeen: number; visits: number; ref: string; refLast: string; utm: string
  device: string; city: string; views: ViewStat[]; msgs: number; lastMsg: string; orders: number; requests: number
}
interface Ev { t: number; type: string; text?: string; p?: string; title?: string }

const LS_ADMIN_KEY = 'platforma_admin_key'
const STATUS_LABEL: Record<Status, string> = { new: 'Новый', in_work: 'В работе', won: 'Купил', lost: 'Потерян', spam: 'Спам' }
const STATUS_COLOR: Record<Status, string> = { new: '#229ED9', in_work: '#e69a00', won: '#27ae60', lost: '#8a8a8a', spam: '#c0392b' }
const EV_LABEL: Record<string, string> = {
  visit: '🚪 Зашёл на сайт', view: '👁 Смотрел', chat_in: '💬 Написал в чат', chat_out: '👷 Ответили в чате',
  order: '🛒 Заказ', callback: '📞 Обратный звонок', pricematch: '🏷 «Дешевле конкурентов»', design: '🏠 Дизайн-проект',
  service: '🛠 Заявка на услугу', card: '💳 Карта лояльности', note: '📝 Заметка',
}
const when = (ts: number) => new Date(ts).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const ago = (ts: number) => {
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1) return 'только что'
  if (m < 60) return `${m} мин назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч назад`
  return `${Math.floor(h / 24)} дн назад`
}
const title = (l: Lead) => l.name || l.phone || `Гость ${l.vid.slice(0, 4)}`
const hot = (l: Lead) => l.orders > 0 || l.requests > 0 || Boolean(l.phone) || l.visits >= 3

export default function AdminLeadsPage() {
  const [key, setKey] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | Status | 'hot'>('all')
  const [open, setOpen] = useState<string | null>(null)
  const [detail, setDetail] = useState<{ lead: Lead; events: Ev[] } | null>(null)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try { localStorage.setItem('plt_owner', '1') } catch {} // свои заходы не попадают в базу
    const k = localStorage.getItem(LS_ADMIN_KEY)
    if (k) setKey(k)
  }, [])

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(path, { ...init, headers: { 'x-admin-key': key, 'Content-Type': 'application/json' }, cache: 'no-store' })
    if (res.status === 401) { localStorage.removeItem(LS_ADMIN_KEY); setKey(''); setError('Неверный ключ'); throw new Error('401') }
    return res
  }, [key])

  const load = useCallback(async () => {
    if (!key) return
    try {
      const res = await api('/api/admin/leads')
      const d = await res.json()
      if (d.error) { setError(d.error === 'kv_not_configured' ? 'Redis (KV) не подключён — база лидов не работает' : 'Ошибка загрузки'); return }
      setError(''); setLeads(d.leads)
    } catch {}
  }, [key, api])

  useEffect(() => { load(); const iv = setInterval(load, 20000); return () => clearInterval(iv) }, [load])

  const openLead = async (vid: string) => {
    setOpen(vid); setDetail(null); setSaved(false)
    try {
      const res = await api(`/api/admin/leads?vid=${vid}`)
      const d = await res.json()
      if (d.lead) { setDetail(d); setNote(d.lead.note || '') }
    } catch {}
  }

  const save = async (patch: Record<string, unknown>) => {
    if (!detail) return
    try {
      const res = await api('/api/admin/leads', { method: 'POST', body: JSON.stringify({ vid: detail.lead.vid, ...patch }) })
      const d = await res.json()
      if (d.lead) { setDetail(prev => prev && { ...prev, lead: d.lead }); setSaved(true); load() }
    } catch {}
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads?.length ?? 0, hot: 0 }
    for (const l of leads ?? []) { c[l.status] = (c[l.status] ?? 0) + 1; if (hot(l) && l.status === 'new') c.hot++ }
    return c
  }, [leads])

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (leads ?? []).filter(l => {
      if (filter === 'hot' ? !(hot(l) && l.status === 'new') : filter !== 'all' && l.status !== filter) return false
      if (!s) return true
      return [l.name, l.phone, l.email, l.ref, l.city, l.lastMsg, l.note, ...l.views.map(v => v.title)].join(' ').toLowerCase().includes(s)
    })
  }, [leads, q, filter])

  const exportCsv = async () => {
    try {
      const res = await api('/api/admin/leads?format=csv')
      const blob = await res.blob()
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    } catch {}
  }

  if (!key) {
    return (
      <div style={{ maxWidth: 360, margin: '80px auto', padding: 20, textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, marginBottom: 14 }}>База лидов</h1>
        <input value={keyInput} onChange={e => setKeyInput(e.target.value)} type="password" placeholder="Ключ администратора"
          onKeyDown={e => { if (e.key === 'Enter' && keyInput.trim()) { localStorage.setItem(LS_ADMIN_KEY, keyInput.trim()); setKey(keyInput.trim()) } }}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 15, boxSizing: 'border-box' }} />
        {error && <div style={{ color: '#c0392b', marginTop: 8, fontSize: 13 }}>{error}</div>}
        <button className="btn-sm primary" style={{ marginTop: 12, width: '100%', height: 40 }}
          onClick={() => { if (keyInput.trim()) { localStorage.setItem(LS_ADMIN_KEY, keyInput.trim()); setKey(keyInput.trim()) } }}>Войти</button>
      </div>
    )
  }

  const chip = (id: typeof filter, label: string) => (
    <button key={id} onClick={() => setFilter(id)} style={{
      padding: '6px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
      border: '1px solid ' + (filter === id ? 'var(--dark)' : 'var(--border)'),
      background: filter === id ? 'var(--dark)' : 'var(--surface)', color: filter === id ? '#fff' : 'var(--text)',
    }}>{label}{counts[id] != null ? ` · ${counts[id] ?? 0}` : ''}</button>
  )

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 16px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, margin: 0, flex: 1 }}>База лидов</h1>
        <a href="/admin/chat" style={{ fontSize: 13 }}>Чат</a>
        <a href="/admin/orders" style={{ fontSize: 13 }}>Заказы</a>
        <a href="/admin/stats" style={{ fontSize: 13 }}>Метрика</a>
        <button className="btn-sm" onClick={exportCsv}>⬇ Excel (CSV)</button>
      </div>
      {error && <div style={{ color: '#c0392b', marginBottom: 10 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {chip('all', 'Все')}{chip('hot', '🔥 Горячие новые')}
        {(['new', 'in_work', 'won', 'lost', 'spam'] as Status[]).map(s => chip(s, STATUS_LABEL[s]))}
      </div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 Имя, телефон, город, товар, сообщение…"
        style={{ width: '100%', maxWidth: 420, boxSizing: 'border-box', height: 38, padding: '0 14px', border: '1px solid var(--border)', borderRadius: 20, fontSize: 14, marginBottom: 14, outline: 'none' }} />

      {leads == null ? <div style={{ color: 'var(--muted)' }}>Загрузка…</div> : shown.length === 0 ? (
        <div style={{ color: 'var(--muted)', padding: 30, textAlign: 'center' }}>Пока пусто. Лиды появятся, как только посетители начнут заходить на сайт.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: open ? 'minmax(0,1fr) minmax(0,1.1fr)' : '1fr', gap: 16, alignItems: 'start' }} className="leads-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {shown.map(l => {
              const prod = l.views.filter(v => v.product).sort((a, b) => b.last - a.last)[0]
              return (
                <button key={l.vid} onClick={() => openLead(l.vid)} style={{
                  textAlign: 'left', background: 'var(--surface)', cursor: 'pointer', padding: '12px 14px', borderRadius: 14,
                  border: '1px solid ' + (open === l.vid ? 'var(--dark)' : 'var(--border)'),
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14.5 }}>{hot(l) && '🔥 '}{title(l)}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#fff', background: STATUS_COLOR[l.status], padding: '2px 8px', borderRadius: 10 }}>{STATUS_LABEL[l.status]}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                    {l.phone && <>📞 {l.phone} · </>}визитов {l.visits} · {ago(l.lastSeen)}
                    {l.city && <> · 📍 {l.city}</>}{l.ref && <> · ↩ {l.ref}</>}{l.utm && <> · 🎯 {l.utm}</>}
                  </div>
                  {prod && <div style={{ fontSize: 12.5, marginTop: 4 }}>👁 {prod.title || prod.p}</div>}
                  {l.lastMsg && <div style={{ fontSize: 12.5, marginTop: 3, color: '#1a7fad' }}>💬 {l.lastMsg}</div>}
                </button>
              )
            })}
          </div>

          {open && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, position: 'sticky', top: 12 }}>
              {!detail ? <div style={{ color: 'var(--muted)' }}>Загрузка…</div> : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 17, flex: 1 }}>{title(detail.lead)}</div>
                    <button className="btn-sm" onClick={() => { setOpen(null); setDetail(null) }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {(['new', 'in_work', 'won', 'lost', 'spam'] as Status[]).map(s => (
                      <button key={s} onClick={() => save({ status: s })} style={{
                        padding: '5px 11px', borderRadius: 16, fontSize: 12.5, cursor: 'pointer',
                        border: '1px solid ' + STATUS_COLOR[s],
                        background: detail.lead.status === s ? STATUS_COLOR[s] : 'transparent',
                        color: detail.lead.status === s ? '#fff' : STATUS_COLOR[s],
                      }}>{STATUS_LABEL[s]}</button>
                    ))}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
                    {detail.lead.phone && <div>📞 <a href={`tel:+${detail.lead.phone.replace(/\D/g, '')}`}>{detail.lead.phone}</a></div>}
                    {detail.lead.email && <div>✉️ {detail.lead.email}</div>}
                    <div>🗓 Первый визит: {when(detail.lead.firstSeen)} · последний: {when(detail.lead.lastSeen)}</div>
                    <div>🔁 Визитов: {detail.lead.visits} · 💬 сообщений: {detail.lead.msgs} · 🛒 заказов: {detail.lead.orders} · 📝 заявок: {detail.lead.requests}</div>
                    <div>↩️ Пришёл с: {detail.lead.ref || 'прямой заход'}{detail.lead.utm && ` · метка: ${detail.lead.utm}`}</div>
                    <div>{detail.lead.device === 'Телефон' ? '📱' : '💻'} {detail.lead.device || '—'}{detail.lead.city && ` · 📍 ${detail.lead.city}`}</div>
                  </div>

                  {detail.lead.views.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>Чем интересовался</div>
                      {detail.lead.views.slice(0, 12).map(v => (
                        <div key={v.p} style={{ fontSize: 13, lineHeight: 1.55 }}>
                          <a href={v.p} target="_blank" rel="noopener noreferrer">{v.product ? '🛍 ' : ''}{v.title || v.p}</a>
                          {v.n > 1 && <span style={{ color: 'var(--muted)' }}> × {v.n}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>Заметка менеджера</div>
                    <textarea value={note} onChange={e => { setNote(e.target.value); setSaved(false) }} rows={3}
                      placeholder="Что обсудили, когда перезвонить…"
                      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--border)', borderRadius: 10, padding: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
                    <button className="btn-sm primary" style={{ marginTop: 6 }} onClick={() => save({ note })}>Сохранить</button>
                    {saved && <span style={{ marginLeft: 8, fontSize: 12.5, color: '#27ae60' }}>✓ сохранено</span>}
                  </div>

                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>История</div>
                  <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {detail.events.map((e, i) => (
                      <div key={i} style={{ fontSize: 12.5, lineHeight: 1.45, paddingLeft: 10, borderLeft: '2px solid var(--border)' }}>
                        <span style={{ color: 'var(--muted)' }}>{when(e.t)} · </span>
                        <b>{EV_LABEL[e.type] ?? e.type}</b>
                        {(e.title || e.p || e.text) && <div style={{ color: 'var(--text)' }}>{e.type === 'view' ? (e.title || e.p) : e.text}</div>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
      <style>{`@media (max-width: 900px){ .leads-grid{ grid-template-columns: 1fr !important } }`}</style>
    </div>
  )
}
