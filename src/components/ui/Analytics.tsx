'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Мини-метрика: просмотры страниц, источник, путь по сайту, уход со страницы.
// Свои заходы (браузер, где открывалась /admin/chat) и роботы не считаются.
const SESSION_MS = 30 * 60_000
const rid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)

function skip(): boolean {
  try {
    return location.pathname.startsWith('/admin') || localStorage.getItem('plt_owner') === '1' || !!navigator.webdriver
  } catch { return true }
}

function send(body: object) {
  try {
    const data = JSON.stringify(body)
    if (navigator.sendBeacon) navigator.sendBeacon('/api/m/collect', new Blob([data], { type: 'text/plain' }))
    else fetch('/api/m/collect', { method: 'POST', body: data, keepalive: true }).catch(() => {})
  } catch {}
}

export function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (skip()) return
    try {
      let vid = localStorage.getItem('plt_a_vid')
      const rv = !!vid
      if (!vid) { vid = rid(); localStorage.setItem('plt_a_vid', vid) }
      const now = Date.now()
      let s: { start: number; last: number; pc: number; prev: string } | null = null
      try { s = JSON.parse(sessionStorage.getItem('plt_a_s') || 'null') } catch {}
      const ns = !s || now - s.last > SESSION_MS
      if (!s || ns) s = { start: now, last: now, pc: 0, prev: '' }
      const prev = s.prev
      s.pc += 1; s.last = now; s.prev = pathname
      sessionStorage.setItem('plt_a_s', JSON.stringify(s))
      let u: object | undefined
      if (ns) {
        const q = new URLSearchParams(location.search)
        u = { s: q.get('utm_source'), m: q.get('utm_medium'), c: q.get('utm_campaign'), y: q.has('yclid') || q.has('gclid') ? 1 : 0 }
      }
      send({ t: 'pv', vid, ns, rv, p: pathname, pp: prev, ref: ns ? document.referrer : '', u })
    } catch {}
  }, [pathname])

  useEffect(() => {
    let lastLeave = 0
    const leave = () => {
      if (skip()) return
      const now = Date.now()
      if (now - lastLeave < 1500) return
      lastLeave = now
      try {
        const s = JSON.parse(sessionStorage.getItem('plt_a_s') || 'null')
        const vid = localStorage.getItem('plt_a_vid')
        if (!s || !vid) return
        send({ t: 'leave', vid, p: s.prev, pc: s.pc, dur: now - s.start })
      } catch {}
    }
    const onVis = () => { if (document.visibilityState === 'hidden') leave() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pagehide', leave)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pagehide', leave)
    }
  }, [])

  return null
}
