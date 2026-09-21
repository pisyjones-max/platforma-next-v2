import { NextRequest, NextResponse } from 'next/server'
import { sendTG, tgEsc } from '@/lib/telegram'
import { saveLead, markDelivered } from '@/lib/orderStore'
import { normalizePhone, formatPhone } from '@/lib/phone'

const TITLES: Record<string, string> = {
  loyalty: '💳 *Заявка на карту — PLATFORMA*',
  specialist: '📐 *Вызов специалиста — PLATFORMA*',
}

export async function POST(req: NextRequest) {
  const { phone, product, type } = await req.json()
  // Любой формат ввода (8…, 9…, +7…) приводим к +7 (XXX) XXX-XX-XX
  const norm = normalizePhone(String(phone ?? ''))
  const shown = norm ? formatPhone(norm) : String(phone ?? '')
  const title = TITLES[String(type)] ?? '📞 *Обратный звонок — PLATFORMA*'
  const text =
    `${title}\n\n` +
    `📱 *Телефон:* ${tgEsc(shown)}\n` +
    `📦 *Товар:* ${tgEsc(product ?? '—')}\n` +
    `🕐 ${new Date().toLocaleString('ru-RU')}`
  const lead = await saveLead({ kind: 'callback', phone: shown, note: String(product ?? '') })
  const ok = await sendTG(text)
  if (ok) await markDelivered(lead)
  return NextResponse.json({ ok, saved: true })
}
