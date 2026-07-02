import { NextRequest, NextResponse } from 'next/server'
import { kvSet, isKvConfigured } from '@/lib/kv'
import { normalizePhone } from '@/lib/phone'

export async function POST(req: NextRequest) {
  const { name, phone } = await req.json()
  const p = normalizePhone(phone)
  if (!p) return NextResponse.json({ ok: false, error: 'bad_phone' }, { status: 400 })

  if (!isKvConfigured()) {
    // База карт ещё не подключена в Vercel (KV_REST_API_URL / KV_REST_API_TOKEN) —
    // заявка всё равно уходит менеджеру в Telegram, но верификация по телефону работать не будет.
    console.warn('[CARD] issue: KV not configured, card not persisted')
    return NextResponse.json({ ok: true, persisted: false })
  }

  try {
    await kvSet(`card:${p}`, { name: String(name ?? '').slice(0, 200), issuedAt: Date.now(), source: 'site' })
    return NextResponse.json({ ok: true, persisted: true })
  } catch (e) {
    console.error('[CARD] issue error:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
