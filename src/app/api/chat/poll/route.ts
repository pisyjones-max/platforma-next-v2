import { NextRequest, NextResponse } from 'next/server'
import { TG_TOKEN } from '@/lib/constants'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  const lastId = parseInt(searchParams.get('lastId') || '0')

  if (!sessionId) return NextResponse.json({ messages: [], lastId: 0 })

  try {
    // Fetch last 100 updates starting from known offset
    // offset=-1 means "give me the absolute latest updates"
    // We go back a bit to not miss anything
    const offset = lastId > 0 ? lastId : -100
    const res = await fetch(
      `https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${offset}&limit=100&timeout=0`,
      { cache: 'no-store' }
    )
    const data = await res.json()

    if (!data.ok || !data.result?.length) {
      return NextResponse.json({ messages: [], lastId })
    }

    const newLastId = data.result[data.result.length - 1].update_id
    const messages: { text: string; ts: number; updateId: number }[] = []

    for (const upd of data.result) {
      // Skip already seen updates
      if (upd.update_id <= lastId) continue

      const msg = upd.message
      if (!msg?.text) continue

      // Format 1: abc123de: текст ответа
      const match = msg.text.match(/^([a-z0-9]+):\s*([\s\S]+)/i)
      if (match && match[1].toLowerCase() === sessionId.toLowerCase()) {
        messages.push({ text: match[2].trim(), ts: msg.date * 1000, updateId: upd.update_id })
        continue
      }

      // Format 2: /reply abc123de текст ответа
      const cmdMatch = msg.text.match(/^\/reply\s+([a-z0-9]+)\s+([\s\S]+)/i)
      if (cmdMatch && cmdMatch[1].toLowerCase() === sessionId.toLowerCase()) {
        messages.push({ text: cmdMatch[2].trim(), ts: msg.date * 1000, updateId: upd.update_id })
      }
    }

    return NextResponse.json({ messages, lastId: newLastId })
  } catch (e) {
    console.error('[CHAT] poll error:', e)
    return NextResponse.json({ messages: [], lastId })
  }
}
