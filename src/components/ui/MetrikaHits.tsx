'use client'
import { Suspense, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ymGoal, ymHit } from '@/lib/metrika'

function Inner() {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const first = useRef(true)

  // Переходы между страницами внутри SPA. Первый хит отправляет ym('init').
  useEffect(() => {
    if (first.current) { first.current = false; return }
    ymHit(location.pathname + location.search)
  }, [pathname, search])

  // Клики по телефону — одна цель на весь сайт (Header, Footer, hero и т.д.)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="tel:"]')
      if (a) ymGoal('phone_click')
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  return null
}

export function MetrikaHits() {
  return <Suspense fallback={null}><Inner /></Suspense>
}
