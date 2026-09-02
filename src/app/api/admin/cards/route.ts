import { NextRequest, NextResponse } from 'next/server'
import { kvSet, kvGet, kvDel, kvScanKeys, isKvConfigured } from '@/lib/kv'
import { normalizePhone } from '@/lib/phone'
import { ADMIN_KEY, CARD_WELCOME_BONUS } from '@/lib/constants'

interface CardRecord {
  name?: string
  issuedAt?: number
  source?: string
  bonus?: number
  bonusReason?: string
  points?: number
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
    await kvSet(`card:${p}`, {
      name: String(name ?? '').slice(0, 200),
      issuedAt: Date.now(),
      source: 'admin',
      points: CARD_WELCOME_BONUS,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[ADMIN] add card error:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

// Ручное списание баллов — решение принимает менеджер по телефону/при заказе
// в зависимости от категории товара и условий поставки. Формулы списания
// намеренно нет: это управленческое решение, а не автоматический расчёт.
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isKvConfigured()) return NextResponse.json({ error: 'kv_not_configured' }, { status: 503 })

  const { phone, amount } = await req.json()
  const p = normalizePhone(phone)
  const delta = Number(amount)
  if (!p) return NextResponse.json({ error: 'bad_phone' }, { status: 400 })
  if (!Number.isFinite(delta) || delta <= 0) return NextResponse.json({ error: 'bad_amount' }, { status: 400 })

  try {
    const rec = await kvGet<CardRecord>(`card:${p}`)
    if (!rec) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const current = rec.points ?? 0
    const points = Math.max(0, Math.round(current - delta))
    await kvSet(`card:${p}`, { ...rec, points })
    return NextResponse.json({ ok: true, points })
  } catch (e) {
    console.error('[ADMIN] redeem points error:', e)
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
