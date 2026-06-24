import { NextRequest, NextResponse } from 'next/server'
import { sendTG, tgEsc } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  const { phone, product } = await req.json()
  const text =
    `📞 *Обратный звонок — PLATFORMA*\n\n` +
    `📱 *Телефон:* ${tgEsc(phone)}\n` +
    `📦 *Товар:* ${tgEsc(product ?? '—')}\n` +
    `🕐 ${new Date().toLocaleString('ru-RU')}`
  const ok = await sendTG(text)
  return NextResponse.json({ ok })
}
