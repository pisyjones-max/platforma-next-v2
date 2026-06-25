'use client'
import { useState, useEffect, useRef } from 'react'
import { useUI } from '@/context/UIContext'

const BANNERS = [
  {
    id: 'loyalty',
    icon: '💳',
    title: 'Карта лояльности',
    text: 'Скидка −7% на все позиции + 5 000 ₽ бонусами при первом заказе',
    cta: 'Получить карту →',
    action: 'loyalty' as const,
    badge: 'ВЫГОДА',
  },
  {
    id: 'discount',
    icon: '🚛',
    title: 'Самовывоз из Ногинска',
    text: 'Экономьте 7% — заберите заказ сами. Работаем без выходных.',
    cta: 'Узнать адрес →',
    action: 'delivery' as const,
    badge: '−7%',
  },
  {
    id: 'consult',
    icon: '👷',
    title: 'Бесплатный выезд замерщика',
    text: 'Специалист рассчитает кровлю и подберёт материал. Выезд 0 ₽.',
    cta: 'Вызвать замерщика →',
    action: 'consult' as const,
    badge: 'БЕСПЛАТНО',
  },
]

// Этапы: off-screen-left → slide-right (едет к правому краю) → open (у правого края) → slide-out-right → hidden
type Phase = 'offLeft' | 'slideRight' | 'open' | 'slideOutRight' | 'hidden'

const FIRST_DELAY = 1000
const SHOW_DURATION = 12_000
const INTERVAL = 50_000

export function PromoBanner() {
  const { openLoyalty, openConsult } = useUI()
  const [bannerIdx, setBannerIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('hidden')
  const [dismissed, setDismissed] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const after = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms)
    timers.current.push(t)
    return t
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isMobile || dismissed) return

    const runCycle = () => {
      clearTimers()
      // 1. Появляемся мгновенно слева за экраном
      setPhase('offLeft')
      // 2. Через 50мс запускаем анимацию едем вправо к правому краю
      after(50, () => setPhase('slideRight'))
      // 3. После завершения анимации (650мс) — стоим открытыми
      after(700, () => setPhase('open'))
      // 4. Через SHOW_DURATION уезжаем вправо за экран
      after(700 + SHOW_DURATION, () => {
        setPhase('slideOutRight')
        after(700, () => setPhase('hidden'))
      })
    }

    const first = setTimeout(() => {
      runCycle()
      const iv = setInterval(() => {
        setBannerIdx(i => (i + 1) % BANNERS.length)
        runCycle()
      }, INTERVAL)
      timers.current.push(iv as unknown as ReturnType<typeof setTimeout>)
    }, FIRST_DELAY)

    return () => { clearTimeout(first); clearTimers() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, dismissed])

  if (isMobile || dismissed) return null

  const banner = BANNERS[bannerIdx]

  const dismiss = () => {
    clearTimers()
    setPhase('slideOutRight')
    after(700, () => setDismissed(true))
  }

  const handleCta = () => {
    clearTimers()
    setPhase('slideOutRight')
    after(350, () => {
      if (banner.action === 'loyalty') openLoyalty()
      else if (banner.action === 'consult') openConsult()
      else window.location.href = '/delivery'
    })
    after(700, () => setPhase('hidden'))
  }

  const toggleOpen = () => {
    if (phase === 'open') {
      clearTimers()
      setPhase('slideOutRight')
      after(700, () => setPhase('hidden'))
    } else if (phase === 'hidden') {
      setPhase('offLeft')
      after(50, () => setPhase('slideRight'))
      after(700, () => setPhase('open'))
    }
  }

  // translateX: offLeft = -120vw (за левым краем), slideRight → 0 (у правого края), open = 0, slideOutRight = +120vw
  const tx =
    phase === 'offLeft' ? '-120vw'
    : phase === 'hidden' ? '120vw'
    : phase === 'slideOutRight' ? '120vw'
    : '0'

  const animated = phase !== 'offLeft' && phase !== 'hidden'

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        bottom: 90,
        zIndex: 500,
        width: 350,
        transform: `translateX(${tx})`,
        transition: animated ? 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
        filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.5))',
      }}
    >
      {/* Таб — торчит слева от баннера чтобы кликнуть */}
      <div
        onClick={toggleOpen}
        style={{
          position: 'absolute',
          left: -44,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'linear-gradient(180deg, #2d5a3d 0%, #1a3828 100%)',
          borderRadius: '12px 0 0 12px',
          width: 44,
          height: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '1px solid rgba(126,204,154,.3)',
          borderRight: 'none',
          gap: 6,
          boxShadow: '-4px 0 16px rgba(0,0,0,.3)',
        }}
      >
        <span style={{ fontSize: 20 }}>{banner.icon}</span>
        <span style={{
          fontSize: 9, color: 'rgba(255,255,255,.85)', fontWeight: 700,
          writingMode: 'vertical-rl', transform: 'rotate(180deg)',
          letterSpacing: 1, textTransform: 'uppercase',
        }}>акция</span>
      </div>

      {/* Тело */}
      <div style={{
        background: 'linear-gradient(145deg, #1a3828 0%, #253d2b 60%, #1e4030 100%)',
        borderRadius: '16px 0 0 16px',
        color: '#fff',
        position: 'relative',
        border: '1px solid rgba(126,204,154,.25)',
        borderRight: 'none',
        overflow: 'hidden',
      }}>
        {/* Верхняя акцентная полоса */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #7ecc9a 0%, #4caf70 100%)' }} />

        <div style={{ padding: '18px 20px 20px 20px' }}>
          {/* Бейдж + закрыть */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{
              background: '#7ecc9a', color: '#0d1f14',
              fontSize: 10, fontWeight: 800, letterSpacing: 1.2,
              padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase',
            }}>{banner.badge}</span>
            <button onClick={e => { e.stopPropagation(); dismiss() }} style={{
              background: 'rgba(255,255,255,.12)', border: 'none', color: 'rgba(255,255,255,.7)',
              width: 26, height: 26, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, cursor: 'pointer',
            }}>✕</button>
          </div>

          {/* Иконка + текст */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: 'rgba(126,204,154,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
            }}>{banner.icon}</div>
            <div>
              <div style={{ fontFamily: 'var(--fh,sans-serif)', fontWeight: 800, fontSize: 16, lineHeight: 1.25, marginBottom: 6 }}>
                {banner.title}
              </div>
              <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.6 }}>
                {banner.text}
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleCta}
            style={{
              width: '100%', padding: '14px 0',
              background: 'linear-gradient(135deg, #7ecc9a 0%, #5ab87a 100%)',
              border: 'none', borderRadius: 12,
              color: '#0d1f14', fontWeight: 800, fontSize: 14.5,
              cursor: 'pointer', transition: 'transform .15s, filter .15s',
              letterSpacing: 0.2,
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            {banner.cta}
          </button>

          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11.5, opacity: 0.45 }}>
            или звоните: +7 (933) 203-30-05
          </div>

          {/* Точки */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            {BANNERS.map((_, i) => (
              <div key={i} onClick={() => setBannerIdx(i)} style={{
                width: i === bannerIdx ? 20 : 6, height: 6, borderRadius: 3,
                background: i === bannerIdx ? '#7ecc9a' : 'rgba(255,255,255,.2)',
                transition: 'all .3s', cursor: 'pointer',
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
