'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props {
  show: boolean
  productTitle: string
  onClose: () => void
  onGoToCart: () => void
}

export function AddedToCartToast({ show, productTitle, onClose, onGoToCart }: Props) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 5000)
      return () => clearTimeout(t)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9000, background: 'var(--dark)', color: '#fff',
      borderRadius: 16, padding: '14px 20px',
      boxShadow: '0 12px 40px rgba(0,0,0,.35)',
      display: 'flex', flexDirection: 'column', gap: 10,
      minWidth: 280, maxWidth: 340,
      animation: 'toastIn .3s cubic-bezier(.34,1.4,.64,1) forwards',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>🛒</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Товар в корзине!</div>
          <div style={{ fontSize: 11, opacity: 0.65, lineHeight: 1.3,
            maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {productTitle}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff',
          width: 24, height: 24, borderRadius: '50%', fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>✕</button>
      </div>
      <button onClick={onGoToCart} style={{
        width: '100%', height: 38, borderRadius: 10,
        background: 'var(--accent)', color: '#fff', border: 'none',
        fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background .15s',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-h)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
      >
        Перейти в корзину →
      </button>
    </div>
  )
}
