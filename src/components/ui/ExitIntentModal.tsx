'use client'
import { useState, useEffect, useRef } from 'react'
import { useUI } from '@/context/UIContext'

export function ExitIntentModal() {
  const { exitOpen, closeExit, openLoyalty } = useUI()
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (shown) return
    const alreadyShown = sessionStorage.getItem('exit_shown')
    if (alreadyShown) return

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && !shown) {
        setShown(true)
        sessionStorage.setItem('exit_shown', '1')
        // триггерим через 200ms чтобы не было конфликтов
        setTimeout(() => {
          const ev = new Event('show-exit')
          window.dispatchEvent(ev)
        }, 200)
      }
    }

    // Показываем через 30с на мобилке тоже
    const timer = setTimeout(() => {
      if (!shown && !sessionStorage.getItem('exit_shown')) {
        setShown(true)
        sessionStorage.setItem('exit_shown', '1')
        window.dispatchEvent(new Event('show-exit'))
      }
    }, 45000)

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      clearTimeout(timer)
    }
  }, [shown])

  useEffect(() => {
    const handler = () => {
      const { openExit } = window as unknown as { openExit?: () => void }
      // Используем событие для связи с UIContext
    }
  }, [])

  if (!exitOpen) return null

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(5px)' }}
        onClick={closeExit} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 901,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 24, width: '100%', maxWidth: 420,
          overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,.3)',
          animation: 'mIn .3s cubic-bezier(.34,1.2,.64,1)',
        }}>
          {/* Шапка */}
          <div style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #a33318 100%)',
            padding: '28px 24px', textAlign: 'center', position: 'relative', color: '#fff',
          }}>
            <button onClick={closeExit} style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff',
              width: 28, height: 28, borderRadius: '50%', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🎁</div>
            <div style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
              Подождите! Вам подарок
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
              Оформите карту лояльности прямо сейчас<br />и получите <strong>5 000 ₽</strong> бонусами
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Что получает */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { icon: '💳', text: '5 000 ₽ бонусными рублями сразу' },
                { icon: '🏷️', text: 'Скидка −7% на весь ассортимент' },
                { icon: '📦', text: 'Кэшбэк 0.5% с каждой покупки' },
                { icon: '🔧', text: 'Бесплатный замер специалистом' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <button onClick={() => { closeExit(); openLoyalty() }}
              style={{
                width: '100%', height: 50, borderRadius: 12,
                background: 'var(--accent)', color: '#fff', border: 'none',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-h)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              🎁 Получить 5 000 ₽ бонусами
            </button>

            <button onClick={closeExit} style={{
              width: '100%', marginTop: 10, padding: '10px 0', background: 'none',
              border: 'none', fontSize: 12, color: 'var(--muted)', cursor: 'pointer',
            }}>
              Нет, продолжить без скидки
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
