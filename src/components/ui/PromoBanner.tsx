'use client'
import { useState, useEffect } from 'react'
import { useUI } from '@/context/UIContext'

const BANNERS = [
  {
    id: 'loyalty',
    icon: '💳',
    title: 'Карта лояльности',
    text: 'Скидка −7% + 5 000 ₽ бонусами при оформлении',
    cta: 'Получить карту',
    action: 'loyalty' as const,
  },
  {
    id: 'discount',
    icon: '🏷️',
    title: 'Скидка при самовывозе',
    text: 'Заберите сами из Ногинска и сэкономьте 7%',
    cta: 'Подробнее',
    action: 'delivery' as const,
  },
  {
    id: 'consult',
    icon: '👷',
    title: 'Бесплатный замер',
    text: 'Выезд специалиста для расчёта кровли — 0 ₽',
    cta: 'Вызвать замерщика',
    action: 'consult' as const,
  },
]

// Delay before first banner (ms)
const FIRST_DELAY = 25_000
// Interval between banners
const INTERVAL = 60_000
// How long banner stays visible before sliding back
const SHOW_DURATION = 8_000

export function PromoBanner() {
  const { openLoyalty, openConsult } = useUI()
  const [bannerIdx, setBannerIdx] = useState(0)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isMobile || dismissed) return

    let showTimeout: ReturnType<typeof setTimeout>
    let hideTimeout: ReturnType<typeof setTimeout>
    let intervalId: ReturnType<typeof setInterval>

    const showBanner = () => {
      setVisible(true)
      hideTimeout = setTimeout(() => {
        setVisible(false)
      }, SHOW_DURATION)
    }

    showTimeout = setTimeout(() => {
      showBanner()
      intervalId = setInterval(() => {
        setBannerIdx(i => (i + 1) % BANNERS.length)
        showBanner()
      }, INTERVAL)
    }, FIRST_DELAY)

    return () => {
      clearTimeout(showTimeout)
      clearTimeout(hideTimeout)
      clearInterval(intervalId)
    }
  }, [isMobile, dismissed])

  if (isMobile || dismissed) return null

  const banner = BANNERS[bannerIdx]

  const handleCta = () => {
    setVisible(false)
    if (banner.action === 'loyalty') openLoyalty()
    else if (banner.action === 'consult') openConsult()
    else if (banner.action === 'delivery') window.location.href = '/delivery'
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    setVisible(false)
    setTimeout(() => setDismissed(true), 600)
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: visible ? 0 : -340,
        bottom: 100,
        zIndex: 500,
        width: 320,
        transition: 'left 0.55s cubic-bezier(0.34, 1.1, 0.64, 1)',
        filter: 'drop-shadow(4px 4px 18px rgba(0,0,0,0.35))',
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #192C1E 0%, #253d2b 100%)',
        borderRadius: '0 18px 18px 0',
        padding: '18px 20px 18px 20px',
        color: '#fff',
        position: 'relative',
        borderTop: '1px solid rgba(126,204,154,.2)',
        borderRight: '1px solid rgba(126,204,154,.2)',
        borderBottom: '1px solid rgba(126,204,154,.2)',
      }}>
        {/* Close */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff',
            width: 24, height: 24, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, cursor: 'pointer', lineHeight: 1,
          }}
        >✕</button>

        {/* Tab on right side to peek */}
        <div style={{
          position: 'absolute',
          right: -38,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'linear-gradient(135deg, #253d2b, #192C1E)',
          borderRadius: '0 10px 10px 0',
          width: 38,
          height: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '1px solid rgba(126,204,154,.2)',
          borderLeft: 'none',
          gap: 4,
        }}
          onClick={() => setVisible(v => !v)}
        >
          <span style={{ fontSize: 18 }}>{banner.icon}</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,.6)', writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', letterSpacing: 0.5 }}>акция</span>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14, paddingRight: 20 }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>{banner.icon}</span>
          <div>
            <div style={{ fontFamily: 'var(--fh)', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{banner.title}</div>
            <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>{banner.text}</div>
          </div>
        </div>

        <button
          onClick={handleCta}
          style={{
            width: '100%', padding: '10px 0',
            background: 'var(--accent)', border: 'none',
            borderRadius: 10, color: '#111',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            transition: 'opacity .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {banner.cta} →
        </button>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {BANNERS.map((_, i) => (
            <div key={i} style={{
              width: i === bannerIdx ? 16 : 6, height: 6,
              borderRadius: 3,
              background: i === bannerIdx ? 'var(--accent)' : 'rgba(255,255,255,.25)',
              transition: 'all .3s',
              cursor: 'pointer',
            }}
              onClick={() => setBannerIdx(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
