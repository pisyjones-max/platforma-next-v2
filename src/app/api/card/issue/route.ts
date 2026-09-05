import { NextRequest, NextResponse } from 'next/server'
import { kvSet, kvGet, isKvConfigured } from '@/lib/kv'
import { normalizePhone } from '@/lib/phone'
import { DESIGN_PROJECT_PRICE, CARD_WELCOME_BONUS } from '@/lib/constants'
import { LOYALTY_FEATURES, REFERRAL_BONUS_POINTS } from '@/lib/loyaltyFeatures'
import type { CardRecord } from '@/lib/loyaltyEngine'

interface DesignLead {
  name?: string
  status?: string
}

export async function POST(req: NextRequest) {
  const { name, phone, ref, email } = await req.json()
  const p = normalizePhone(phone)
  if (!p) return NextResponse.json({ ok: false, error: 'bad_phone' }, { status: 400 })
  const cleanEmail = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? email.trim().slice(0, 200)
    : undefined

  if (!isKvConfigured()) {
    // База карт ещё не подключена в Vercel (KV_REST_API_URL / KV_REST_API_TOKEN) —
    // заявка всё равно уходит менеджеру в Telegram, но верификация по телефону работать не будет.
    console.warn('[CARD] issue: KV not configured, card not persisted')
    return NextResponse.json({ ok: true, persisted: false })
  }

  try {
    // Карта на этот телефон уже есть — не перезатираем баланс, просто отдаём как есть.
    const existing = await kvGet<CardRecord>(`card:${p}`)
    if (existing) {
      return NextResponse.json({ ok: true, persisted: true, alreadyExists: true, points: existing.points ?? 0 })
    }

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

    // Реферальная программа: ref — телефон того, кто пригласил (см. loyaltyEngine.referralLink)
    let referredBy: string | undefined
    let referralBonus = 0
    if (LOYALTY_FEATURES.referralProgram && ref) {
      const refPhone = normalizePhone(ref)
      if (refPhone && refPhone !== p) {
        const refCard = await kvGet<CardRecord>(`card:${refPhone}`)
        if (refCard) {
          referredBy = refPhone
          referralBonus = REFERRAL_BONUS_POINTS
          await kvSet(`card:${refPhone}`, {
            ...refCard,
            points: (refCard.points ?? 0) + REFERRAL_BONUS_POINTS,
            referralCount: (refCard.referralCount ?? 0) + 1,
            lastActivityAt: Date.now(),
          })
        }
      }
    }

    const points = CARD_WELCOME_BONUS + referralBonus

    await kvSet(`card:${p}`, {
      name: String(name ?? '').slice(0, 200),
      issuedAt: Date.now(),
      lastActivityAt: Date.now(),
      source: 'site',
      purchases: 0,
      // Приветственный баланс баллов — начисляется на каждую карту при выпуске.
      // Списание баллов НЕ автоматическое: менеджер решает сумму списания
      // при оформлении конкретного заказа (см. /admin/cards).
      points,
      ...(cleanEmail ? { email: cleanEmail } : {}),
      ...(bonus ? { bonus, bonusReason } : {}),
      ...(referredBy ? { referredBy } : {}),
    })
    return NextResponse.json({ ok: true, persisted: true, bonus, referralBonus, points })
  } catch (e) {
    console.error('[CARD] issue error:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
