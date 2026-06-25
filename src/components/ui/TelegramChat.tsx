'use client'
import { useState, useEffect, useRef } from 'react'

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
  if (!sid) {
    sid = genSessionId()
    sessionStorage.setItem('plt_chat_sid', sid)
  }
  return sid
}

export function TelegramChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [name, setName] = useState('')
  const [nameSet, setNameSet] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef<string>('')
  const lastIdRef = useRef<number>(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const seenIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    sessionId.current = getOrCreateSession()
    // Restore lastId from sessionStorage
    const saved = sessionStorage.getItem('plt_chat_lastId')
    if (saved) lastIdRef.current = parseInt(saved)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  // Polling
  useEffect(() => {
    if (!nameSet) return

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/chat/poll?sessionId=${sessionId.current}&lastId=${lastIdRef.current}`
        )
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
              seenIds.current.add(uid)
              return true
            })
            .map((m: { text: string; ts: number; updateId: number }) => ({
              id: `mgr-${m.updateId}`,
              text: m.text,
              from: 'manager' as const,
              ts: m.ts,
            }))

          if (newMsgs.length) {
            setMessages(prev => [...prev, ...newMsgs])
            if (!open) setUnread(u => u + newMsgs.length)
          }
        }
      } catch {}
    }

    poll() // immediate first poll
    pollRef.current = setInterval(poll, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameSet])

  const startChat = () => {
    if (!name.trim()) return
    setNameSet(true)
    setMessages([{
      id: 'welcome',
      text: `Привет, ${name.trim()}! 👋 Напишите ваш вопрос — менеджер ответит в течение нескольких минут.`,
      from: 'manager',
      ts: Date.now(),
    }])
  }

  const send = async () => {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    setMessages(prev => [...prev, {
      id: `vis-${Date.now()}`,
      text,
      from: 'visitor',
      ts: Date.now(),
    }])

    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: sessionId.current, name }),
      })
    } catch {}
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      nameSet ? send() : startChat()
    }
  }

  const fmt = (ts: number) =>
    new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Чат с менеджером"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 600,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #229ED9 0%, #1a7fad 100%)',
          border: 'none', color: '#fff', fontSize: 26, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(34,158,217,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform .2s, box-shadow .2s',
        }}
      >
        {open ? '✕' : '💬'}
        {unread > 0 && !open && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#e74c3c', color: '#fff',
            fontSize: 11, fontWeight: 700,
            minWidth: 18, height: 18, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}>{unread}</span>
        )}
      </button>

      {/* Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 600,
          width: 340, maxWidth: 'calc(100vw - 32px)', height: 480,
          borderRadius: 20, background: '#fff',
          boxShadow: '0 12px 60px rgba(0,0,0,.25)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'chatIn .3s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <style>{`@keyframes chatIn{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #229ED9 0%, #1a7fad 100%)',
            padding: '14px 16px', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>👷</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Менеджер PLATFORMA</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                <span style={{
                  display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                  background: '#7ECC9A', marginRight: 5, verticalAlign: 'middle',
                }} />
                Онлайн · ответим за 5 мин
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px',
            background: '#f5f5f5', display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {!nameSet ? (
              <div style={{ textAlign: 'center', color: '#7B7772', fontSize: 13, marginTop: 30 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
                <div style={{ fontWeight: 700, marginBottom: 6, color: '#1A1916' }}>Добро пожаловать!</div>
                <div>Введите ваше имя, чтобы начать чат</div>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.from === 'visitor' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%',
                    background: m.from === 'visitor' ? 'linear-gradient(135deg,#229ED9,#1a7fad)' : '#fff',
                    color: m.from === 'visitor' ? '#fff' : '#1A1916',
                    borderRadius: m.from === 'visitor' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
                    boxShadow: '0 1px 4px rgba(0,0,0,.1)',
                  }}>
                    <div>{m.text}</div>
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: 'right' }}>{fmt(m.ts)}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px', background: '#fff', borderTop: '1px solid #eee',
            display: 'flex', gap: 8, alignItems: 'flex-end',
          }}>
            {!nameSet ? (
              <>
                <input
                  value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKey}
                  placeholder="Ваше имя..."
                  style={{
                    flex: 1, border: '1px solid #e4e1da', borderRadius: 10,
                    padding: '10px 12px', fontSize: 13, outline: 'none',
                  }}
                />
                <button onClick={startChat} disabled={!name.trim()} style={{
                  background: '#229ED9', border: 'none', color: '#fff',
                  width: 38, height: 38, borderRadius: 10, fontSize: 18, cursor: 'pointer',
                  opacity: name.trim() ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>→</button>
              </>
            ) : (
              <>
                <textarea
                  value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                  placeholder="Написать сообщение..." rows={1}
                  style={{
                    flex: 1, border: '1px solid #e4e1da', borderRadius: 10,
                    padding: '10px 12px', fontSize: 13, outline: 'none',
                    resize: 'none', maxHeight: 80, overflowY: 'auto',
                  }}
                />
                <button onClick={send} disabled={!input.trim() || sending} style={{
                  background: '#229ED9', border: 'none', color: '#fff',
                  width: 38, height: 38, borderRadius: 10, fontSize: 16, cursor: 'pointer',
                  opacity: input.trim() && !sending ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>▲</button>
              </>
            )}
          </div>

          <div style={{ textAlign: 'center', fontSize: 10, color: '#aaa', padding: '4px 0 8px' }}>
            Powered by Telegram · PLATFORMA
          </div>
        </div>
      )}
    </>
  )
}
