'use client'
import { useEffect, useRef, useState } from 'react'

type TargetKey = 'calculator' | 'price-match'

const TARGETS: Record<TargetKey, { anchorId: string; bubble: string }> = {
  calculator: {
    anchorId: 'home-calculator',
    bubble: 'Посчитайте, сколько материала нужно →',
  },
  'price-match': {
    anchorId: 'price-match-banner',
    bubble: 'Нашли дешевле? Пришлите цену →',
  },
}

const CYCLE_MS = 16000
const WALK_MS = 1400

export function WalkingMascot() {
  const [visible, setVisible] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [x, setX] = useState(24) // px от левого края
  const [facing, setFacing] = useState<'right' | 'left'>('right')
  const [walking, setWalking] = useState(false)
  const [bubble, setBubble] = useState<string | null>(null)
  const nextTargetRef = useRef<TargetKey>('calculator')

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (!visible) return
    if (reducedMotion) {
      // Без анимации ходьбы — просто периодически меняем текст в баббле,
      // без движения по экрану.
      const id = setInterval(() => {
        const key = nextTargetRef.current
        setBubble(TARGETS[key].bubble)
        nextTargetRef.current = key === 'calculator' ? 'price-match' : 'calculator'
      }, CYCLE_MS)
      setBubble(TARGETS.calculator.bubble)
      return () => clearInterval(id)
    }

    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    const walkTo = (targetX: number, onArrive: () => void) => {
      setFacing(targetX > x ? 'right' : 'left')
      setWalking(true)
      setX(targetX)
      timers.push(setTimeout(() => {
        if (cancelled) return
        setWalking(false)
        onArrive()
      }, WALK_MS))
    }

    const cycle = () => {
      const key = nextTargetRef.current
      const el = document.getElementById(TARGETS[key].anchorId)
      const vw = window.innerWidth
      // Идём в правую треть экрана, где обычно виден CTA соответствующего блока.
      const targetX = Math.min(vw - 220, Math.max(24, vw * 0.62))
      setBubble(null)
      walkTo(targetX, () => {
        if (cancelled) return
        setBubble(TARGETS[key].bubble)
        if (el) {
          // Тихая подсветка блока-цели, без навязчивого скролла самого по себе —
          // пользователь решает, переходить ли, кликнув по баблу.
          el.classList.add('mascot-highlight')
          timers.push(setTimeout(() => el.classList.remove('mascot-highlight'), 2200))
        }
      })
      nextTargetRef.current = key === 'calculator' ? 'price-match' : 'calculator'
    }

    // Первый заход — с небольшой задержкой, чтобы не бросаться в глаза сразу при загрузке.
    timers.push(setTimeout(cycle, 3000))
    const interval = setInterval(cycle, CYCLE_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
      timers.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reducedMotion])

  if (!visible) return null

  const handleBubbleClick = () => {
    const key = nextTargetRef.current === 'calculator' ? 'price-match' : 'calculator'
    const el = document.getElementById(TARGETS[key].anchorId)
    el?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
  }

  const dismiss = () => {
    setVisible(false)
  }

  return (
    <div
      className="mascot-wrap"
      style={reducedMotion ? undefined : { left: x, transition: `left ${WALK_MS}ms ease-in-out` }}
    >
      {bubble && (
        <button className="mascot-bubble" onClick={handleBubbleClick} type="button">
          {bubble}
        </button>
      )}
      <button className="mascot-dismiss" onClick={dismiss} type="button" aria-label="Скрыть">
        ×
      </button>
      <div className={`mascot-figure ${walking && !reducedMotion ? 'is-walking' : ''}`} style={{ transform: facing === 'left' ? 'scaleX(-1)' : undefined }} aria-hidden="true">
        <svg width="92" height="48" viewBox="0 0 92 48" fill="none">
          {/* кузов */}
          <rect x="3" y="8" width="48" height="22" rx="3" fill="#F2B705" />
          <rect x="3" y="8" width="48" height="5" fill="#D89A00" />
          {/* кабина */}
          <path d="M51 14h20a4 4 0 0 1 3.6 2.2l4.2 8.4v5.4H51V14Z" fill="#F2B705" />
          {/* окно кабины */}
          <path d="M56 17h13a2.6 2.6 0 0 1 2.3 1.4l2.2 4.4a1.3 1.3 0 0 1-1.2 1.9H56v-7.7Z" fill="#BFE3F0" />
          {/* водитель за рулём */}
          <circle cx="63" cy="20.5" r="3.4" fill="#6E4B3A" />
          <circle cx="61.7" cy="19.6" r="0.5" fill="#2a1c14" />
          <circle cx="64.3" cy="19.6" r="0.5" fill="#2a1c14" />
          <path d="M61.4 21.6c.6.6 2 .6 2.6 0" stroke="#2a1c14" strokeWidth="0.6" strokeLinecap="round" fill="none" />
          <rect x="51" y="28" width="27" height="4" fill="#D89A00" />
          {/* бампер */}
          <rect x="75" y="29" width="5" height="5" rx="1" fill="#3a3a3a" />
          {/* колёса */}
          <g className="mascot-wheel" style={{ transformOrigin: '17px 37px' }}>
            <circle cx="17" cy="37" r="8" fill="#232323" />
            <circle cx="17" cy="37" r="3.2" fill="#8a8a8a" />
          </g>
          <g className="mascot-wheel" style={{ transformOrigin: '64px 37px' }}>
            <circle cx="64" cy="37" r="8" fill="#232323" />
            <circle cx="64" cy="37" r="3.2" fill="#8a8a8a" />
          </g>
        </svg>
      </div>
    </div>
  )
}
