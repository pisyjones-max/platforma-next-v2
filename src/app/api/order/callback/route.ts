import { NextRequest, NextResponse } from 'next/server'
import { sendTG, tgEsc } from '@/lib/telegram'
import { saveLead, markDelivered } from '@/lib/orderStore'
import { normalizePhone, formatPhone, isPlausiblePhone } from '@/lib/phone'

const TITLES: Record<string, string> = {
  loyalty: '💳 *Заявка на карту — PLATFORMA*',
  specialist: '📐 *Вызов специалиста — PLATFORMA*',
}

// Анти-спам: in-memory (на VDS один процесс PM2). Не более 5 заявок с IP за 10 минут
// и не более 1 заявки с одного номера за 2 минуты.
const ipHits = new Map<string, number[]>()
const phoneHits = new Map<string, number>()
const IP_WINDOW = 10 * 60_000
const IP_MAX = 5
const PHONE_WINDOW = 2 * 60_000

function rateLimited(ip: string, phone: string): boolean {
  const now = Date.now()
  if (ipHits.size > 5000) ipHits.clear()
  if (phoneHits.size > 5000) phoneHits.clear()
  const hits = (ipHits.get(ip) ?? []).filter(t => now - t < IP_WINDOW)
  if (hits.length >= IP_MAX) { ipHits.set(ip, hits); return true }
  const last = phoneHits.get(phone)
  if (last && now - last < PHONE_WINDOW) return true
  hits.push(now)
  ipHits.set(ip, hits)
  phoneHits.set(phone, now)
  return false
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }

  // Honeypot: настоящие формы это поле не шлют
  if (body.website || body.hp) return NextResponse.json({ ok: true, saved: false })

  const phoneRaw = String(body.phone ?? '').slice(0, 50)
  const norm = normalizePhone(phoneRaw)
  if (!norm || !isPlausiblePhone(phoneRaw)) {
    return NextResponse.json({ ok: false, error: 'bad_phone' }, { status: 400 })
  }
  const shown = formatPhone(norm)

  const ip = (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown').split(',')[0].trim()
  if (rateLimited(ip, norm)) {
    // Для клиента выглядит как успех (дубль уже в работе), но повторно не шлём
    return NextResponse.json({ ok: true, saved: false, duplicate: true })
  }

  const product = String(body.product ?? '').slice(0, 1000)
  const title = TITLES[String(body.type)] ?? '📞 *Обратный звонок — PLATFORMA*'
  const text =
    `${title}\n\n` +
    `📱 *Телефон:* ${tgEsc(shown)}\n` +
    `📦 *Товар:* ${tgEsc(product || '—')}\n` +
    `🕐 ${new Date().toLocaleString('ru-RU')}`
  const lead = await saveLead({ kind: 'callback', phone: shown, note: product })
  const ok = await sendTG(text)
  if (ok) await markDelivered(lead)
  return NextResponse.json({ ok, saved: true })
}
