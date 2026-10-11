import { NextRequest, NextResponse } from 'next/server'
import { kvGet } from '@/lib/kv'
import { getMeta, SID_RE, type ManagerMsg } from '@/lib/chatStore'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')?.toLowerCase()
  const lastId = parseInt(searchParams.get('lastId') || '0')
  if (!sessionId || !SID_RE.test(sessionId)) return NextResponse.json({ messages: [], lastId: 0 })

  try {
    const [list, meta] = await Promise.all([
      kvGet<ManagerMsg[]>(`chat:${sessionId}`).then(l => l ?? []),
      getMeta(sessionId),
    ])
    const messages = list.filter(m => m.updateId > lastId)
    const newLastId = messages.length ? messages[messages.length - 1].updateId : lastId
    return NextResponse.json({ messages, lastId: newLastId, ...meta })
  } catch (e) {
    console.error('[CHAT] poll error:', e)
    return NextResponse.json({ messages: [], lastId })
  }
}
