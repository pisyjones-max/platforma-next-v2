import { NextRequest, NextResponse } from 'next/server'
import { sendTG, tgEsc } from '@/lib/telegram'
import { saveLead, markDelivered } from '@/lib/orderStore'

export async function POST(req: NextRequest) {
  const { phone, product } = await req.json()
  const text =
    `📞 *Обратный звонок — PLATFORMA*\n\n` +
    `📱 *Телефон:* ${tgEsc(phone)}\n` +
    `📦 *Товар:* ${tgEsc(product ?? '—')}\n` +
    `🕐 ${new Date().toLocaleString('ru-RU')}`
  const lead = await saveLead({ kind: 'callback', phone: String(phone ?? ''), note: String(product ?? '') })
  const ok = await sendTG(text)
  if (ok) await markDelivered(lead)
  return NextResponse.json({ ok, saved: true })
}
