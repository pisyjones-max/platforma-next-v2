import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_KEY } from '@/lib/constants'
import { isKvConfigured, kvPipeline } from '@/lib/kv'
import { M_HASHES, mDay, mKey } from '@/lib/metricsStore'

function checkAuth(req: NextRequest): boolean {
  if (!ADMIN_KEY) return false
  const key = req.headers.get('x-admin-key') ?? new URL(req.url).searchParams.get('key')
  return key === ADMIN_KEY
}

function toObj(flat: unknown): Record<string, number> {
  const o: Record<string, number> = {}
  if (!Array.isArray(flat)) return o
  for (let i = 0; i + 1 < flat.length; i += 2) o[String(flat[i])] = Number(flat[i + 1]) || 0
  return o
}
const top = (o: Record<string, number>, n = 15) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n)

// GET ?days=7 (1..30) — сводка мини-метрики
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isKvConfigured()) return NextResponse.json({ error: 'kv_not_configured' }, { status: 503 })
  try {
    const days = Math.min(30, Math.max(1, parseInt(new URL(req.url).searchParams.get('days') || '7') || 7))
    const dates = Array.from({ length: days }, (_, i) => mDay(Date.now() - i * 86400_000)).reverse()
    const per = M_HASHES.length + 1
    const cmds: (string | number)[][] = []
    for (const d of dates) {
      for (const h of M_HASHES) cmds.push(['HGETALL', mKey(d, h)])
      cmds.push(['PFCOUNT', mKey(d, 'uv')])
    }
    cmds.push(['PFCOUNT', ...dates.map(d => mKey(d, 'uv'))]) // уникальные за весь период
    const res = await kvPipeline(cmds)

    const sums: Record<string, Record<string, number>> = {}
    for (const h of M_HASHES) sums[h] = {}
    const daily = dates.map((d, i) => {
      const base = i * per
      const obj: Record<string, Record<string, number>> = {}
      M_HASHES.forEach((h, j) => {
        const o = toObj(res[base + j]); obj[h] = o
        for (const [k, v] of Object.entries(o)) sums[h][k] = (sums[h][k] ?? 0) + v
      })
      return { d, pv: obj.tot.pv ?? 0, sessions: obj.tot.sessions ?? 0, uv: Number(res[base + M_HASHES.length]) || 0 }
    })
    const t = sums.tot
    return NextResponse.json({
      days: daily,
      totals: {
        pv: t.pv ?? 0,
        sessions: t.sessions ?? 0,
        uv: Number(res[res.length - 1]) || 0,
        bounceRate: t.leaves ? Math.round(((t.bounces ?? 0) / t.leaves) * 100) : null,
        avgSec: t.leaves ? Math.round((t.dur ?? 0) / t.leaves) : null,
      },
      tables: {
        src: top(sums.src), ref: top(sums.ref), pages: top(sums.pages), entry: top(sums.entry),
        exit: top(sums.exit), flow: top(sums.flow), dev: top(sums.dev), ret: top(sums.ret),
        utm: top(sums.utm), goals: top(sums.goals),
      },
    })
  } catch (e) {
    console.error('[ADMIN] stats error:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
