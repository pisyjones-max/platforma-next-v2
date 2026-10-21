import { NextRequest, NextResponse } from 'next/server'
import { TG_TOKEN, TG_CHAT_ID } from '@/lib/constants'
import { tgUrl, tgRelayHeaders } from '@/lib/telegram'
import { appendLog, SID_RE } from '@/lib/chatStore'
import { isKvConfigured } from '@/lib/kv'
import { bumpGoal } from '@/lib/metricsStore'
import { SITE_URL } from '@/lib/site'
import { crmTouch, cleanVid, phoneFromText } from '@/lib/crmStore'

function tgEsc(s: string) {
  return String(s || '').replace(/([_*`\[])/g, '\\$1')
}

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ ok: false }, { status: 400 }) }
  const message = String(body.message ?? '').trim().slice(0, 2000)
  const sessionId = String(body.sessionId ?? '').toLowerCase()
  const name = String(body.name ?? '').slice(0, 60)
  // Страница, с которой написали (для карточки товара — ссылка на сам товар).
  // Принимаем только внутренний путь, чтобы в Telegram нельзя было подсунуть чужой URL.
  const rawPage = String(body.page ?? '')
  const page = /^\/[A-Za-z0-9\-._~\/%]{0,300}$/.test(rawPage) ? rawPage : ''
  const pageTitle = String(body.pageTitle ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)
  if (!message || !SID_RE.test(sessionId)) return NextResponse.json({ ok: false })

  // 1) Сначала пишем в журнал — сообщение не потеряется, даже если Telegram недоступен
  let logged = false
  if (isKvConfigured()) {
    try { await appendLog(sessionId, 'visitor', message); logged = true }
    catch (e) { console.error('[CHAT] log error:', e) }
  }

  // 1.1) Мини-CRM: запоминаем человека, его вопрос и телефон, если написал в тексте
  const lead = await crmTouch({
    vid: cleanVid(body.vid),
    sid: sessionId,
    name,
    phone: phoneFromText(message),
    event: { type: 'chat_in', text: message, p: page || undefined, title: pageTitle || undefined },
    counters: { msgs: 1 },
    lastMsg: message,
  })
  let crmLines = ''
  if (lead) {
    const returning = lead.visits > 1 || lead.msgs > 1 || lead.orders > 0
    const since = new Date(lead.firstSeen).toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit' })
    const top = lead.views.filter(v => v.product).sort((a, b) => b.last - a.last).slice(0, 3)
      .map(v => (v.title || v.p).slice(0, 50))
    crmLines =
      (returning
        ? `🔁 *Знакомый клиент:* визит №${lead.visits}, с ${since}, сообщений ${lead.msgs}${lead.orders ? `, заказов ${lead.orders}` : ''}\n`
        : `🆕 *Новый клиент, первое обращение*\n`) +
      (lead.phone ? `📞 ${tgEsc(lead.phone)}\n` : '') +
      (lead.city ? `📍 ${tgEsc(lead.city)}\n` : '') +
      (top.length ? `👁 *Смотрел:* ${tgEsc(top.join(' · '))}\n` : '') +
      (lead.ref ? `↩️ пришёл с ${tgEsc(lead.ref)}\n` : '')
  }

  // 2) Затем уведомление в Telegram
  const text =
    `💬 *Чат с сайта — PLATFORMA*\n\n` +
    `👤 *Посетитель:* ${tgEsc(name || 'Аноним')}\n` +
    `🔑 *Сессия:* \`${sessionId}\`\n` +
    (page ? `🔗 *Страница:* [${tgEsc(pageTitle || page)}](${SITE_URL}${page})\n` : '') +
    crmLines +
    `\n${tgEsc(message)}`
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
