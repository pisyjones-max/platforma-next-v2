import { NextRequest, NextResponse } from 'next/server'
import { addManagerMessage } from '@/lib/chatStore'
import { webhookSecret } from '@/lib/telegram'

const sid = (t: string) => t.match(/Сессия:\s*`?([a-z0-9]+)`?/i)?.[1]?.toLowerCase() ?? null

export async function POST(req: NextRequest) {
  const secret = webhookSecret()
  if (!secret || req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  try {
    const upd = await req.json()
    const msg = upd.message || upd.channel_post
    const text: string | undefined = msg?.text
    if (!text) return NextResponse.json({ ok: true })

    let session: string | null = null
    let body = text.trim()
    const replyTo = msg.reply_to_message?.text
    if (replyTo) session = sid(replyTo)
    if (!session) {
      const m = text.match(/^\/reply\s+([a-z0-9]+)\s+([\s\S]+)/i) || text.match(/^([a-z0-9]+):\s*([\s\S]+)/i)
      if (m) { session = m[1].toLowerCase(); body = m[2].trim() }
    }
    if (!session) return NextResponse.json({ ok: true })

    await addManagerMessage(session, body, msg.date * 1000)
  } catch (e) {
    console.error('[CHAT] webhook error:', e)
  }
  return NextResponse.json({ ok: true })
}
