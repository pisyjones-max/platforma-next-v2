import { NextRequest, NextResponse } from 'next/server'
import { sendTG, tgEsc } from '@/lib/telegram'
import { normalizePhone } from '@/lib/phone'
import { getService } from '@/lib/services'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }

  const serviceSlug = String(body.service ?? '').slice(0, 100)
  const service = getService(serviceSlug)
  if (!service) return NextResponse.json({ ok: false, error: 'bad_service' }, { status: 400 })

  const name = String(body.name ?? '').slice(0, 200).trim()
  const phoneRaw = String(body.phone ?? '')
  const address = String(body.address ?? '').slice(0, 300).trim()
  const comment = String(body.comment ?? '').slice(0, 800).trim()

  const phone = normalizePhone(phoneRaw)
  if (!phone) return NextResponse.json({ ok: false, error: 'bad_phone' }, { status: 400 })
  if (!name) return NextResponse.json({ ok: false, error: 'bad_name' }, { status: 400 })

  const text =
    `🛠 *Заявка на партнёрскую услугу — ${tgEsc(service.title)}*\n\n` +
    `👤 *Имя:* ${tgEsc(name)}\n` +
    `📱 *Телефон:* ${tgEsc(phoneRaw)}\n` +
    (address ? `📍 *Адрес объекта:* ${tgEsc(address)}\n` : '') +
    `💬 ${tgEsc(comment || '—')}\n` +
    `ℹ️ Партнёрская услуга — передать монтажному партнёру, не заказ материала\n` +
    `🕐 ${new Date().toLocaleString('ru-RU')}`

  const sent = await sendTG(text)

  return NextResponse.json({ ok: sent })
}
