'use client'
import { useState, useEffect, useRef } from 'react'
import { PHONE_NUMBER } from '@/lib/constants'

interface Message {
  id: string
  text: string
  from: 'visitor' | 'manager'
  ts: number
}

function genSessionId() {
  return Math.random().toString(36).slice(2, 10)
}

function getOrCreateSession(): string {
  if (typeof window === 'undefined') return ''
  let sid = sessionStorage.getItem('plt_chat_sid')
  if (!sid) { sid = genSessionId(); sessionStorage.setItem('plt_chat_sid', sid) }
  return sid
}

// ── Callback form ──────────────────────────────────────────────
function CallbackForm({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!phone.trim()) return
    setSending(true)
    try {
      await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, product: `Обратный звонок\nИмя: ${name || 'не указано'}`, type: 'callback' }),
      })
      setSent(true)
    } catch {}
    setSending(false)
  }

  if (sent) return (
    <div style={{ padding: '32px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Заявка принята!</div>
      <div style={{ color: '#7B7772', fontSize: 13 }}>Перезвоним в течение 15 минут</div>
      <button onClick={onClose} style={{
        marginTop: 20, padding: '10px 24px', background: '#C8102E',
        color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
      }}>Закрыть</button>
    </div>
  )

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Обратный звонок</div>
      <div style={{ fontSize: 12, color: '#7B7772', marginBottom: 16 }}>Перезвоним в течение 15 минут</div>
      <input
        value={name} onChange={e => setName(e.target.value)}
        placeholder="Ваше имя"
        style={{ width: '100%', border: '1px solid #e4e1da', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
      />
      <input
        value={phone} onChange={e => setPhone(e.target.value)}
        placeholder="+7 (___) ___-__-__" inputMode="tel"
        style={{ width: '100%', border: '1px solid #e4e1da', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14, boxSizing: 'border-box' }}
      />
      <button onClick={send} disabled={!phone.trim() || sending} style={{
        width: '100%', padding: '12px', background: '#C8102E', color: '#fff',
        border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer',
        opacity: phone.trim() && !sending ? 1 : 0.5,
      }}>{sending ? 'Отправляем...' : 'Перезвоните мне'}</button>
    </div>
  )
}

// ── Chat window ────────────────────────────────────────────────
function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [name, setName] = useState('')
  const [nameSet, setNameSet] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef<string>('')
  const lastIdRef = useRef<number>(0)
  const seenIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    sessionId.current = getOrCreateSession()
    const saved = sessionStorage.getItem('plt_chat_lastId')
    if (saved) lastIdRef.current = parseInt(saved)
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!nameSet) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/poll?sessionId=${sessionId.current}&lastId=${lastIdRef.current}`)
        const data = await res.json()
        if (data.lastId && data.lastId > lastIdRef.current) {
          lastIdRef.current = data.lastId
          sessionStorage.setItem('plt_chat_lastId', String(data.lastId))
        }
        if (data.messages?.length) {
          const newMsgs: Message[] = data.messages
            .filter((m: { text: string; ts: number; updateId: number }) => {
              const uid = `mgr-${m.updateId}`
              if (seenIds.current.has(uid)) return false
              seenIds.current.add(uid); return true
            })
            .map((m: { text: string; ts: number; updateId: number }) => ({
              id: `mgr-${m.updateId}`, text: m.text, from: 'manager' as const, ts: m.ts,
            }))
          if (newMsgs.length) setMessages(prev => [...prev, ...newMsgs])
        }
      } catch {}
    }
    poll()
    const iv = setInterval(poll, 5000)
    return () => clearInterval(iv)
  }, [nameSet])

  const startChat = () => {
    if (!name.trim()) return
    setNameSet(true)
    setMessages([{ id: 'welcome', text: `Привет, ${name.trim()}! 👋 Напишите вопрос — ответим в течение нескольких минут.`, from: 'manager', ts: Date.now() }])
  }

  const send = async () => {
    if (!input.trim() || sending) return
    const text = input.trim(); setInput(''); setSending(true)
    setMessages(prev => [...prev, { id: `vis-${Date.now()}`, text, from: 'visitor', ts: Date.now() }])
    try {
      await fetch('/api/chat/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: sessionId.current, name }),
      })
    } catch {}
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); nameSet ? send() : startChat() }
  }
  const fmt = (ts: number) => new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: '#f5f5f5', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!nameSet ? (
          <div style={{ textAlign: 'center', color: '#7B7772', fontSize: 13, marginTop: 30 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#1A1916' }}>Напишите нам!</div>
            <div>Введите ваше имя, чтобы начать чат</div>
          </div>
        ) : messages.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.from === 'visitor' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%',
              background: m.from === 'visitor' ? 'linear-gradient(135deg,#229ED9,#1a7fad)' : '#fff',
              color: m.from === 'visitor' ? '#fff' : '#1A1916',
              borderRadius: m.from === 'visitor' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding: '8px 12px', fontSize: 13, lineHeight: 1.5, boxShadow: '0 1px 4px rgba(0,0,0,.1)',
            }}>
              <div>{m.text}</div>
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: 'right' }}>{fmt(m.ts)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        {!nameSet ? (
          <>
            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKey}
              placeholder="Ваше имя..."
              style={{ flex: 1, border: '1px solid #e4e1da', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none' }} />
            <button onClick={startChat} disabled={!name.trim()} style={{
              background: '#229ED9', border: 'none', color: '#fff', width: 38, height: 38,
              borderRadius: 10, fontSize: 18, cursor: 'pointer', opacity: name.trim() ? 1 : 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>→</button>
          </>
        ) : (
          <>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Написать сообщение..." rows={1}
              style={{ flex: 1, border: '1px solid #e4e1da', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', resize: 'none', maxHeight: 80, overflowY: 'auto' }} />
            <button onClick={send} disabled={!input.trim() || sending} style={{
              background: '#229ED9', border: 'none', color: '#fff', width: 38, height: 38,
              borderRadius: 10, fontSize: 16, cursor: 'pointer',
              opacity: input.trim() && !sending ? 1 : 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>▲</button>
          </>
        )}
      </div>
      <div style={{ textAlign: 'center', fontSize: 10, color: '#aaa', padding: '4px 0 8px' }}>Powered by Telegram · PLATFORMA</div>
    </>
  )
}

// ── Main widget ────────────────────────────────────────────────
type Panel = 'chat' | 'callback' | null

export function TelegramChat() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [unread, setUnread] = useState(0)

  const phoneClean = PHONE_NUMBER.replace(/\D/g, '')

  const openPanel = (p: Panel) => { setPanel(p); setMenuOpen(false); if (p === 'chat') setUnread(0) }
  const closeAll = () => { setPanel(null); setMenuOpen(false) }

  const MENU_ITEMS = [
    { id: 'chat', icon: '💬', label: 'Написать в чат', color: '#229ED9', action: () => openPanel('chat') },
    { id: 'callback', icon: '📞', label: 'Обратный звонок', color: '#27ae60', action: () => openPanel('callback') },
    { id: 'tg', icon: '✈️', label: 'Telegram', color: '#229ED9', action: () => { window.open('https://t.me/bot_pumpdump_bot', '_blank'); setMenuOpen(false) } },
  ]

  return (
    <>
      <style>{`
        @keyframes chatIn{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes menuItemIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
      `}</style>

      {/* FAB */}
      <button
        onClick={() => { if (panel) closeAll(); else setMenuOpen(o => !o) }}
        aria-label="Связаться с нами"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 600,
          width: 56, height: 56, borderRadius: '50%',
          background: panel || menuOpen ? '#555' : 'linear-gradient(135deg,#C8102E,#a00d25)',
          border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .2s, transform .2s',
        }}
      >
        {panel || menuOpen ? '✕' : '💬'}
        {unread > 0 && !panel && !menuOpen && (
          <span style={{
            position: 'absolute', top: -4, right: -4, background: '#e74c3c', color: '#fff',
            fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}>{unread}</span>
        )}
      </button>

      {/* Radial menu */}
      {menuOpen && !panel && (
        <div style={{ position: 'fixed', bottom: 90, right: 24, zIndex: 599, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          {MENU_ITEMS.map((item, i) => (
            <button key={item.id} onClick={item.action} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#fff', border: 'none', borderRadius: 28,
              padding: '10px 16px 10px 12px',
              boxShadow: '0 4px 20px rgba(0,0,0,.18)',
              cursor: 'pointer', whiteSpace: 'nowrap',
              animation: `menuItemIn .25s ${i * 0.06}s both`,
            }}>
              <span style={{
                width: 34, height: 34, borderRadius: '50%',
                background: item.color, color: '#fff', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{item.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#1A1916' }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Panel window */}
      {panel && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 600,
          width: 340, maxWidth: 'calc(100vw - 32px)',
          height: panel === 'callback' ? 'auto' : 480,
          borderRadius: 20, background: '#fff',
          boxShadow: '0 12px 60px rgba(0,0,0,.25)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'chatIn .3s cubic-bezier(0.22,1,0.36,1)',
        }}>
          {/* Header */}
          <div style={{
            background: panel === 'callback'
              ? 'linear-gradient(135deg,#27ae60,#1e8449)'
              : 'linear-gradient(135deg,#229ED9,#1a7fad)',
            padding: '14px 16px', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              {panel === 'callback' ? '📞' : '👷'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {panel === 'callback' ? 'Обратный звонок' : 'Менеджер PLATFORMA'}
              </div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                {panel === 'callback' ? `Перезвоним: ${PHONE_NUMBER}` : 'Онлайн · ответим за 5 мин'}
              </div>
            </div>
            <button onClick={closeAll} style={{
              background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff',
              width: 28, height: 28, borderRadius: '50%', fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>

          {panel === 'callback' ? (
            <CallbackForm onClose={closeAll} />
          ) : (
            <ChatWindow />
          )}
        </div>
      )}
    </>
  )
}
