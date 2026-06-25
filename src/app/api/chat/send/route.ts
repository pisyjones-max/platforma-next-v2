import { NextRequest, NextResponse } from 'next/server'
import { TG_TOKEN, TG_CHAT_ID } from '@/lib/constants'

function tgEsc(s: string) {
  return String(s || '').replace(/([_*`\[])/g, '\\$1')
}

export async function POST(req: NextRequest) {
  const { message, sessionId, name } = await req.json()
  if (!message?.trim()) return NextResponse.json({ ok: false })

  const text =
    `💬 *Чат с сайта — PLATFORMA*\n\n` +
    `👤 *Посетитель:* ${tgEsc(name || 'Аноним')}\n` +
    `🔑 *Сессия:* \`${sessionId}\`\n\n` +
    `${tgEsc(message)}`

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'Markdown' }),
      }
    )
    const data = await res.json()
    return NextResponse.json({ ok: res.ok, messageId: data?.result?.message_id })
  } catch (e) {
    console.error('[CHAT] send error:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
