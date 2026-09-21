import { NextRequest, NextResponse } from 'next/server'
import { kvGet } from '@/lib/kv'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')?.toLowerCase()
  const lastId = parseInt(searchParams.get('lastId') || '0')
  if (!sessionId || !/^[a-z0-9]+$/.test(sessionId)) return NextResponse.json({ messages: [], lastId: 0 })

  try {
    const list = (await kvGet<{ text: string; ts: number; updateId: number }[]>(`chat:${sessionId}`)) ?? []
    const messages = list.filter(m => m.updateId > lastId)
    const newLastId = messages.length ? messages[messages.length - 1].updateId : lastId
    return NextResponse.json({ messages, lastId: newLastId })
  } catch (e) {
    console.error('[CHAT] poll error:', e)
    return NextResponse.json({ messages: [], lastId })
  }
}
