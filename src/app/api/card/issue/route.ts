import { NextRequest, NextResponse } from 'next/server'
import { kvSet, kvGet, isKvConfigured } from '@/lib/kv'
import { normalizePhone } from '@/lib/phone'
import { DESIGN_PROJECT_PRICE } from '@/lib/constants'

interface DesignLead {
  name?: string
  status?: string
}

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
    // Если по этому телефону раньше была заявка на бесплатный дизайн-проект —
    // привязываем бонус к новой карте (списывается при покупке материалов).
    let bonus = 0
    let bonusReason: string | undefined
    try {
      const lead = await kvGet<DesignLead>(`designlead:${p}`)
      if (lead) {
        bonus = DESIGN_PROJECT_PRICE
        bonusReason = 'design-project'
        await kvSet(`designlead:${p}`, { ...lead, status: 'converted' })
      }
    } catch {
      // Не блокируем выпуск карты, если проверка лида не удалась
    }

    await kvSet(`card:${p}`, {
      name: String(name ?? '').slice(0, 200),
      issuedAt: Date.now(),
      source: 'site',
      ...(bonus ? { bonus, bonusReason } : {}),
    })
    return NextResponse.json({ ok: true, persisted: true, bonus })
  } catch (e) {
    console.error('[CARD] issue error:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
