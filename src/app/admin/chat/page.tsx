'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

interface Item {
  sid: string; name: string; page: string; ref: string; mobile: boolean
  firstSeen: number; lastSeen: number; online: boolean; away: boolean
  typing: boolean; chatOpen: boolean; pagesCount: number
  lastMsg: { text: string; from: 'visitor' | 'manager'; ts: number } | null
  msgCount: number; unread: number
}
interface Msg { id: number; from: 'visitor' | 'manager'; text: string; ts: number }
interface Detail {
  sid: string; messages: Msg[]
  presence: null | { name: string; page: string; pages: { p: string; t: number }[]; firstSeen: number; ref: string; mobile: boolean; online: boolean; typing: boolean; chatOpen: boolean; visible: boolean }
}

const LS_ADMIN_KEY = 'platforma_admin_key'
const hm = (ts: number) => new Date(ts).toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' })
const dur = (ms: number) => {
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'меньше минуты'
  if (m < 60) return `${m} мин`
  return `${Math.floor(m / 60)} ч ${m % 60} мин`
}
const ago = (ts: number, now: number) => (ts ? `${dur(now - ts)} назад` : '—')

function beep() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AC(); const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination); o.frequency.value = 880
    g.gain.setValueAtTime(0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
    o.start(); o.stop(ctx.currentTime + 0.4)
  } catch {}
}

export default function AdminChatPage() {
  const [key, setKey] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [now, setNow] = useState(Date.now())
  const [error, setError] = useState('')
  const [sel, setSel] = useState('')
  const [detail, setDetail] = useState<Detail | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const prevUnread = useRef<number | null>(null)
  const lastTypingSent = useRef(0)
  const bottom = useRef<HTMLDivElement>(null)
  const selRef = useRef('')
  selRef.current = sel

  useEffect(() => {
    const k = localStorage.getItem(LS_ADMIN_KEY); if (k) setKey(k)
    try { localStorage.setItem('plt_owner', '1') } catch {} // свои заходы не шлют уведомления
  }, [])

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(path, { ...init, headers: { 'x-admin-key': key, 'Content-Type': 'application/json' }, cache: 'no-store' })
    if (res.status === 401) { localStorage.removeItem(LS_ADMIN_KEY); setKey(''); setError('Неверный ключ'); throw new Error('401') }
    return res.json()
  }, [key])

  const loadList = useCallback(async () => {
    try {
      const d = await api('/api/admin/chat')
      if (d.error) { setError(d.error); return }
      setError(''); setItems(d.items); setNow(d.now)
      if (prevUnread.current !== null && d.unreadTotal > prevUnread.current) {
        beep()
        document.title = `💬 Новое сообщение (${d.unreadTotal})`
        setTimeout(() => { document.title = 'Чат PLATFORMA' }, 4000)
      }
      prevUnread.current = d.unreadTotal
    } catch {}
  }, [api])

  const loadDetail = useCallback(async (sid: string) => {
    try {
      const d = await api(`/api/admin/chat?sid=${sid}`)
      if (selRef.current === sid && !d.error) setDetail(d)
    } catch {}
  }, [api])

  useEffect(() => {
    if (!key) return
    document.title = 'Чат PLATFORMA'
    loadList()
    const iv = setInterval(loadList, 3000)
    return () => clearInterval(iv)
  }, [key, loadList])

  useEffect(() => {
    if (!key || !sel) return
    loadDetail(sel)
    const iv = setInterval(() => loadDetail(sel), 2000)
    return () => clearInterval(iv)
  }, [key, sel, loadDetail])

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [detail?.messages.length, detail?.presence?.typing])

  const open = (sid: string) => { setSel(sid); setDetail(null); setText('') }

  const send = async () => {
    const t = text.trim()
    if (!t || !sel || sending) return
    setSending(true); setText('')
    try { await api('/api/admin/chat', { method: 'POST', body: JSON.stringify({ action: 'reply', sid: sel, text: t }) }) } catch {}
    setSending(false)
    loadDetail(sel)
  }

  const onType = (v: string) => {
    setText(v)
    const n = Date.now()
    if (v && sel && n - lastTypingSent.current > 3000) {
      lastTypingSent.current = n
      api('/api/admin/chat', { method: 'POST', body: JSON.stringify({ action: 'typing', sid: sel }) }).catch(() => {})
    }
  }

  const unlock = () => { const k = keyInput.trim(); if (!k) return; localStorage.setItem(LS_ADMIN_KEY, k); setKey(k) }

  if (!key) {
    return (
      <div style={{ maxWidth: 380, margin: '80px auto', padding: '0 16px', fontFamily: 'var(--fb, sans-serif)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Чат PLATFORMA</h1>
        <input type="password" placeholder="Ключ доступа" value={keyInput} onChange={e => setKeyInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && unlock()}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 8, marginBottom: 10, boxSizing: 'border-box' }} />
        <button onClick={unlock} style={{ width: '100%', padding: '10px 12px', background: '#192C1E', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Войти</button>
        {error && <div style={{ color: '#BF3E22', fontSize: 14, marginTop: 8 }}>{error}</div>}
      </div>
    )
  }

  const onlineCount = items.filter(i => i.online).length
  const cur = items.find(i => i.sid === sel)
  const p = detail?.presence

  const dot = (it: { online: boolean; away?: boolean }) => (
    <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: it.online ? (it.away ? '#E6A100' : '#27ae60') : '#bbb' }} />
  )

  return (
    <div style={{ fontFamily: 'var(--fb, sans-serif)', height: '100dvh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      <style>{`
        .ch-wrap{flex:1;display:flex;min-height:0}
        .ch-list{width:340px;border-right:1px solid #e4e1da;background:#fff;overflow-y:auto}
        .ch-conv{flex:1;display:flex;flex-direction:column;min-width:0}
        @media(max-width:760px){
          .ch-list{width:100%;display:${sel ? 'none' : 'block'}}
          .ch-conv{display:${sel ? 'flex' : 'none'}}
        }
      `}</style>

      <div style={{ padding: '12px 16px', background: '#192C1E', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Чат PLATFORMA</div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>🟢 Сейчас на сайте: {onlineCount}</div>
        {error && <div style={{ fontSize: 12, color: '#ffb4a2' }}>{error}</div>}
      </div>

      <div className="ch-wrap">
        <div className="ch-list">
          {items.length === 0 && <div style={{ padding: 20, color: '#7B7772', fontSize: 14 }}>Пока никого. Посетители появятся здесь, когда зайдут на сайт.</div>}
          {items.map(it => (
            <div key={it.sid} onClick={() => open(it.sid)} style={{
              padding: '10px 14px', borderBottom: '1px solid #f0eee8', cursor: 'pointer',
              background: it.sid === sel ? '#eef5ff' : '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {dot(it)}
                <div style={{ fontWeight: it.unread ? 700 : 600, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {it.name || `Гость ${it.sid.slice(0, 4)}`} {it.mobile ? '📱' : '💻'}
                </div>
                {it.unread > 0 && <span style={{ background: '#C8102E', color: '#fff', borderRadius: 9, fontSize: 12, fontWeight: 700, padding: '0 6px', minWidth: 18, textAlign: 'center' }}>{it.unread}</span>}
              </div>
              <div style={{ fontSize: 12, color: '#7B7772', marginTop: 3 }}>
                {it.typing ? '✍️ печатает…' : it.online ? (it.away ? 'вкладка неактивна' : it.chatOpen ? 'открыл чат' : 'на сайте') : `был ${ago(it.lastSeen, now)}`}
                {it.page && it.online ? ` · ${it.page}` : ''}
              </div>
              {it.lastMsg && (
                <div style={{ fontSize: 13, marginTop: 3, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {it.lastMsg.from === 'manager' ? 'Вы: ' : ''}{it.lastMsg.text}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="ch-conv">
          {!sel ? (
            <div style={{ margin: 'auto', color: '#7B7772', fontSize: 14 }}>Выберите посетителя слева</div>
          ) : (
            <>
              <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid #e4e1da' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="ch-back" onClick={() => setSel('')} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
                  {cur && dot(cur)}
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p?.name || cur?.name || `Гость ${sel.slice(0, 4)}`}</div>
                  <div style={{ fontSize: 12, color: '#7B7772' }}>
                    {p?.typing ? '✍️ печатает…' : p?.online ? (p.visible ? 'на сайте' : 'вкладка неактивна') : 'не на сайте'}
                  </div>
                </div>
                {p && (
                  <div style={{ fontSize: 12, color: '#7B7772', marginTop: 4, lineHeight: 1.5 }}>
                    Сейчас на странице: <b style={{ color: '#1A1916' }}>{p.page || '—'}</b><br />
                    На сайте: {dur(now - p.firstSeen)}{p.ref ? ` · пришёл с ${p.ref}` : ''}{p.chatOpen ? ' · чат открыт' : ''}
                    {p.pages?.length > 1 && <><br />Путь: {p.pages.map(x => x.p).join(' → ')}</>}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {detail?.messages.length === 0 && <div style={{ color: '#7B7772', fontSize: 14, margin: 'auto' }}>Сообщений пока нет — посетитель ещё не писал.</div>}
                {detail?.messages.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.from === 'manager' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '8px 12px', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      background: m.from === 'manager' ? '#229ED9' : '#fff', color: m.from === 'manager' ? '#fff' : '#1A1916',
                      borderRadius: m.from === 'manager' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', boxShadow: '0 1px 4px rgba(0,0,0,.1)',
                    }}>
                      {m.text}
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 3, textAlign: 'right' }}>{hm(m.ts)}</div>
                    </div>
                  </div>
                ))}
                {p?.typing && <div style={{ fontSize: 13, color: '#7B7772' }}>✍️ Посетитель печатает…</div>}
                <div ref={bottom} />
              </div>

              <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
                <textarea value={text} onChange={e => onType(e.target.value)} rows={1} placeholder="Ответить посетителю…"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  style={{ flex: 1, border: '1px solid #e4e1da', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', resize: 'none', maxHeight: 100 }} />
                <button onClick={send} disabled={!text.trim() || sending} style={{
                  background: '#229ED9', border: 'none', color: '#fff', width: 42, borderRadius: 10, fontSize: 16, cursor: 'pointer', opacity: text.trim() && !sending ? 1 : 0.5,
                }}>▲</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
