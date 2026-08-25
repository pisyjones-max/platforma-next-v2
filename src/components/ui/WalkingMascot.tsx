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

const DISMISS_KEY = 'platforma_mascot_dismissed'
// Пауза между визитами к разным блокам — достаточно редко, чтобы не раздражать.
const CYCLE_MS = 16000
const WALK_MS = 1400

export function WalkingMascot() {
  const [visible, setVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [x, setX] = useState(24) // px от левого края
  const [facing, setFacing] = useState<'right' | 'left'>('right')
  const [walking, setWalking] = useState(false)
  const [bubble, setBubble] = useState<string | null>(null)
  const nextTargetRef = useRef<TargetKey>('calculator')

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return
    setVisible(true)
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
    sessionStorage.setItem(DISMISS_KEY, '1')
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
        <svg width="44" height="52" viewBox="0 0 44 52" fill="none">
          {/* каска */}
          <path d="M10 20a12 12 0 0 1 24 0v2H10v-2Z" fill="var(--gold)" />
          <rect x="8" y="21" width="28" height="4" rx="2" fill="var(--gold)" />
          {/* голова */}
          <circle cx="22" cy="16" r="8" fill="#E8B98C" />
          {/* тело */}
          <rect x="13" y="26" width="18" height="16" rx="4" fill="var(--dark)" />
          {/* жилет-полоса */}
          <rect x="13" y="30" width="18" height="4" fill="var(--gold)" />
          {/* ноги */}
          <rect className="mascot-leg mascot-leg-l" x="14" y="41" width="6" height="11" rx="2" fill="#3a4a3f" />
          <rect className="mascot-leg mascot-leg-r" x="24" y="41" width="6" height="11" rx="2" fill="#3a4a3f" />
        </svg>
      </div>
    </div>
  )
}
