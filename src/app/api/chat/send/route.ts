import { NextRequest, NextResponse } from 'next/server'
import { TG_TOKEN, TG_CHAT_ID } from '@/lib/constants'
import { tgUrl, tgRelayHeaders } from '@/lib/telegram'
import { appendLog, SID_RE } from '@/lib/chatStore'
import { isKvConfigured } from '@/lib/kv'
import { bumpGoal } from '@/lib/metricsStore'

function tgEsc(s: string) {
  return String(s || '').replace(/([_*`\[])/g, '\\$1')
}

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ ok: false }, { status: 400 }) }
  const message = String(body.message ?? '').trim().slice(0, 2000)
  const sessionId = String(body.sessionId ?? '').toLowerCase()
  const name = String(body.name ?? '').slice(0, 60)
  if (!message || !SID_RE.test(sessionId)) return NextResponse.json({ ok: false })

  // 1) Сначала пишем в журнал — сообщение не потеряется, даже если Telegram недоступен
  let logged = false
  if (isKvConfigured()) {
    try { await appendLog(sessionId, 'visitor', message); logged = true }
    catch (e) { console.error('[CHAT] log error:', e) }
  }

  // 2) Затем уведомление в Telegram
  const text =
    `💬 *Чат с сайта — PLATFORMA*\n\n` +
    `👤 *Посетитель:* ${tgEsc(name || 'Аноним')}\n` +
    `🔑 *Сессия:* \`${sessionId}\`\n\n` +
    `${tgEsc(message)}`
  let tg = false
  try {
    const res = await fetch(tgUrl(TG_TOKEN, 'sendMessage'), {
      method: 'POST',
      headers: tgRelayHeaders({ 'Content-Type': 'application/json' }),
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'Markdown' }),
    })
    tg = res.ok
    if (!res.ok) console.error('[CHAT] TG send status:', res.status, await res.text().catch(() => ''))
  } catch (e) {
    console.error('[CHAT] send error:', e)
  }
  if (logged || tg) bumpGoal('chat_message').catch(() => {})
  return NextResponse.json({ ok: logged || tg, logged, tg })
}
