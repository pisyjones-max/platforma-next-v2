import { NextRequest, NextResponse } from 'next/server'
import { TG_TOKEN } from '@/lib/constants'

// Polling Telegram updates for chat replies
// Manager replies in Telegram with format: "SESSION_ID: message text"
// or bot replies via /reply command: /reply SESSION_ID message text

const updateOffset: Record<string, number> = {}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  const since = searchParams.get('since') // last known update_id

  if (!sessionId) return NextResponse.json({ messages: [] })

  try {
    const offset = since ? parseInt(since) + 1 : 0
    const res = await fetch(
      `https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${offset}&limit=50&timeout=0`
    )
    const data = await res.json()

    if (!data.ok || !data.result?.length) {
      return NextResponse.json({ messages: [], lastUpdateId: since ? parseInt(since) : 0 })
    }

    const lastUpdateId = data.result[data.result.length - 1].update_id
    const messages: { text: string; ts: number }[] = []

    for (const upd of data.result) {
      const msg = upd.message
      if (!msg?.text) continue

      // Manager replies in format: SESSION_ID: reply text
      const match = msg.text.match(/^([a-z0-9]+):\s*(.+)/si)
      if (match && match[1] === sessionId) {
        messages.push({ text: match[2].trim(), ts: msg.date * 1000 })
      }

      // Or /reply SESSIONID text
      const cmdMatch = msg.text.match(/^\/reply\s+([a-z0-9]+)\s+(.+)/si)
      if (cmdMatch && cmdMatch[1] === sessionId) {
        messages.push({ text: cmdMatch[2].trim(), ts: msg.date * 1000 })
      }
    }

    return NextResponse.json({ messages, lastUpdateId })
  } catch (e) {
    console.error('[CHAT] poll error:', e)
    return NextResponse.json({ messages: [], lastUpdateId: 0 })
  }
}
