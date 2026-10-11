import { NextRequest, NextResponse } from 'next/server'
import { isKvConfigured, kvPipeline } from '@/lib/kv'
import { BOT_UA, classifySource, cleanHost, cleanPath, deviceOf, mDay, mKey, type Utm } from '@/lib/metricsStore'

const VID_RE = /^[a-z0-9]{6,32}$/
const hits = new Map<string, number[]>()
function limited(ip: string): boolean {
  const now = Date.now()
  if (hits.size > 5000) hits.clear()
  const arr = (hits.get(ip) ?? []).filter(t => now - t < 60_000)
  if (arr.length >= 120) { hits.set(ip, arr); return true }
  arr.push(now); hits.set(ip, arr)
  return false
}
const cut = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u001f]/g, '').slice(0, n)

// Приём событий мини-метрики: pv (просмотр страницы) и leave (уход со страницы).
export async function POST(req: NextRequest) {
  const ok = NextResponse.json({ ok: true })
  try {
    if (!isKvConfigured()) return ok
    const ua = req.headers.get('user-agent') || ''
    if (!ua || BOT_UA.test(ua)) return ok
    const ip = (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown').split(',')[0].trim()
    if (limited(ip)) return ok
    const raw = await req.text()
    if (raw.length > 3000) return ok
    const b = JSON.parse(raw)
    const vid = String(b.vid ?? '').toLowerCase()
    if (!VID_RE.test(vid)) return ok
    const d = mDay()
    const k = (n: string) => mKey(d, n)
    const path = cleanPath(b.p)
    if (path.startsWith('/admin') || path.startsWith('/api')) return ok
    const cmds: (string | number)[][] = []

    if (b.t === 'pv') {
      cmds.push(['HINCRBY', k('tot'), 'pv', 1], ['PFADD', k('uv'), vid], ['HINCRBY', k('pages'), path, 1])
      const prev = b.pp ? cleanPath(b.pp) : ''
      if (prev && prev !== path) cmds.push(['HINCRBY', k('flow'), `${prev} → ${path}`, 1])
      if (b.ns) {
        let refHost = ''
        try { refHost = b.ref ? cleanHost(new URL(String(b.ref)).hostname) : '' } catch {}
        const utm: Utm = {
          s: cut(b.u?.s, 40) || null, m: cut(b.u?.m, 40) || null, c: cut(b.u?.c, 60) || null, y: b.u?.y ? 1 : 0,
        }
        const selfHost = req.headers.get('host') || ''
        cmds.push(
          ['HINCRBY', k('tot'), 'sessions', 1],
          ['HINCRBY', k('src'), classifySource(refHost, selfHost, utm), 1],
          ['HINCRBY', k('entry'), path, 1],
          ['HINCRBY', k('dev'), deviceOf(ua), 1],
          ['HINCRBY', k('ret'), b.rv ? 'Вернувшиеся' : 'Новые', 1],
        )
        if (refHost && refHost !== cleanHost(selfHost)) cmds.push(['HINCRBY', k('ref'), refHost, 1])
        if (utm.s || utm.y) cmds.push(['HINCRBY', k('utm'), `${utm.s || (utm.y ? 'click-id' : '-')} / ${utm.m || '-'} / ${utm.c || '-'}`, 1])
      }
    } else if (b.t === 'leave') {
      const dur = Math.max(0, Math.min(1800, Math.round((Number(b.dur) || 0) / 1000)))
      cmds.push(['HINCRBY', k('tot'), 'leaves', 1], ['HINCRBY', k('exit'), path, 1], ['HINCRBY', k('tot'), 'dur', dur])
      if ((Number(b.pc) || 0) <= 1) cmds.push(['HINCRBY', k('tot'), 'bounces', 1])
    } else {
      return ok
    }
    await kvPipeline(cmds)
  } catch (e) {
    console.error('[METRIKA] collect error:', e)
  }
  return ok
}
