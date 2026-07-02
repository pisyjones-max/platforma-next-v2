import { NextRequest, NextResponse } from 'next/server'
import { kvGet, isKvConfigured } from '@/lib/kv'
import { normalizePhone } from '@/lib/phone'

interface CardRecord {
  name?: string
  issuedAt?: number
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  const p = normalizePhone(phone)
  if (!p) return NextResponse.json({ valid: false, error: 'bad_phone' }, { status: 400 })

  if (!isKvConfigured()) {
    console.warn('[CARD] verify: KV not configured')
    return NextResponse.json({ valid: false, error: 'not_configured' }, { status: 503 })
  }

  try {
    const rec = await kvGet<CardRecord>(`card:${p}`)
    return NextResponse.json({ valid: !!rec, name: rec?.name })
  } catch (e) {
    console.error('[CARD] verify error:', e)
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
