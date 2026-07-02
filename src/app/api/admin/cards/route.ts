import { NextRequest, NextResponse } from 'next/server'
import { kvSet, kvGet, kvDel, kvScanKeys, isKvConfigured } from '@/lib/kv'
import { normalizePhone } from '@/lib/phone'
import { ADMIN_KEY } from '@/lib/constants'

interface CardRecord {
  name?: string
  issuedAt?: number
  source?: string
}

function checkAuth(req: NextRequest): boolean {
  if (!ADMIN_KEY) return false // без настроенного ключа админка недоступна вообще
  const key = req.headers.get('x-admin-key') ?? new URL(req.url).searchParams.get('key')
  return key === ADMIN_KEY
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isKvConfigured()) return NextResponse.json({ error: 'kv_not_configured' }, { status: 503 })

  try {
    const keys = await kvScanKeys('card:*')
    const cards = await Promise.all(
      keys.map(async k => {
        const rec = await kvGet<CardRecord>(k)
        return { phone: k.replace(/^card:/, ''), ...rec }
      })
    )
    cards.sort((a, b) => (b.issuedAt ?? 0) - (a.issuedAt ?? 0))
    return NextResponse.json({ cards })
  } catch (e) {
    console.error('[ADMIN] list cards error:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isKvConfigured()) return NextResponse.json({ error: 'kv_not_configured' }, { status: 503 })

  const { name, phone } = await req.json()
  const p = normalizePhone(phone)
  if (!p) return NextResponse.json({ error: 'bad_phone' }, { status: 400 })

  try {
    await kvSet(`card:${p}`, { name: String(name ?? '').slice(0, 200), issuedAt: Date.now(), source: 'admin' })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[ADMIN] add card error:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isKvConfigured()) return NextResponse.json({ error: 'kv_not_configured' }, { status: 503 })

  const { phone } = await req.json()
  const p = normalizePhone(phone)
  if (!p) return NextResponse.json({ error: 'bad_phone' }, { status: 400 })

  try {
    await kvDel(`card:${p}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[ADMIN] delete card error:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
