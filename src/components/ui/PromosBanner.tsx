'use client'
import { useState, useEffect } from 'react'

interface Promo {
  id: string
  brand: string
  brandName: string
  title: string
  desc: string
  discount?: string
  url: string
  color: string
  emoji: string
  validUntil?: string
}

export function PromosBanner() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/promos')
      .then(r => r.json())
      .then(d => {
        if (d.promos?.length) {
          setPromos(d.promos)
          setTimeout(() => setVisible(true), 3000) // показать через 3 сек
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!promos.length || dismissed) return
    const iv = setInterval(() => {
      setIdx(i => (i + 1) % promos.length)
    }, 8000)
    return () => clearInterval(iv)
  }, [promos.length, dismissed])

  if (!promos.length || dismissed || !visible) return null

  const p = promos[idx]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: 20,
        zIndex: 490,
        width: 320,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,.35)',
        animation: 'slideInLeft .5s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Brand header bar */}
      <div style={{
        background: p.color,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
          🏭 Акция от {p.brandName}
        </span>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'rgba(255,255,255,.2)',
            border: 'none',
            color: '#fff',
            width: 22,
            height: 22,
            borderRadius: '50%',
            fontSize: 11,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >✕</button>
      </div>

      {/* Body */}
      <div style={{
        background: '#fff',
        padding: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 32 }}>{p.emoji}</span>
          <div>
            <div style={{
              fontFamily: 'var(--fh,sans-serif)',
              fontWeight: 800,
              fontSize: 14,
              color: 'var(--text,#1A1916)',
              marginBottom: 4,
            }}>{p.title}</div>
            {p.discount && (
              <span style={{
                display: 'inline-block',
                background: p.color,
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
                marginBottom: 6,
              }}>{p.discount}</span>
            )}
            <div style={{ fontSize: 12, color: 'var(--muted,#7B7772)', lineHeight: 1.5 }}>
              {p.desc}
            </div>
          </div>
        </div>

        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '10px',
            background: p.color,
            color: '#fff',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          Узнать подробнее →
        </a>

        {/* Dots */}
        {promos.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }}>
            {promos.map((_, i) => (
              <div
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === idx ? p.color : '#ddd',
                  transition: 'all .3s',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
