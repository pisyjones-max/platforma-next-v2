import { NextRequest, NextResponse } from 'next/server'
import { SID_RE, savePresence, type Presence } from '@/lib/chatStore'
import { isKvConfigured, kvSetNx } from '@/lib/kv'
import { sendTG, tgEsc } from '@/lib/telegram'

const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|yandex|google|bing/i
const cut = (v: unknown, n: number) => String(v ?? '').slice(0, n)

// Сигнал «я на сайте» от виджета: страница, печатает ли, открыт ли чат.
export async function POST(req: NextRequest) {
  try {
    if (!isKvConfigured()) return NextResponse.json({ ok: false })
    const ua = req.headers.get('user-agent') || ''
    if (BOT_RE.test(ua)) return NextResponse.json({ ok: true })
    const raw = await req.text()
    if (raw.length > 4000) return NextResponse.json({ ok: false }, { status: 413 })
    const b = JSON.parse(raw)
    const sid = String(b.sessionId || '').toLowerCase()
    if (!SID_RE.test(sid)) return NextResponse.json({ ok: false })
    const now = Date.now()
    const pages = Array.isArray(b.pages)
      ? b.pages.slice(-8).map((x: any) => ({ p: cut(x?.p, 200), t: Number(x?.t) || now }))
      : []
    const p: Presence = {
      sid,
      name: cut(b.name, 60),
      page: cut(b.page, 200),
      pages,
      firstSeen: Number(b.firstSeen) || now,
      lastSeen: now,
      typingAt: b.typing ? now : 0,
      chatOpen: !!b.chatOpen,
      visible: b.visible !== false,
      gone: !!b.gone,
      mobile: /Mobile|Android|iPhone/i.test(ua),
      ref: cut(b.ref, 200),
    }
    await savePresence(p)

    // Уведомление в Telegram о новом посетителе: один раз на человека за 6 часов.
    // Отключить: CHAT_NOTIFY_VISITS=0 в .env.local. Свои заходы (owner) и /admin не считаем.
    const vid = String(b.vid || '').toLowerCase()
    if (b.first && !b.owner && !b.gone && /^[a-z0-9]{4,32}$/.test(vid)
        && process.env.CHAT_NOTIFY_VISITS !== '0' && !p.page.startsWith('/admin')) {
      if (await kvSetNx(`chatvisit:${vid}`, 1, 6 * 3600)) {
        const text =
          `👀 *Новый посетитель на сайте*\n\n` +
          `📄 ${tgEsc(p.page || '/')}\n` +
          `${p.ref ? `↩️ с ${tgEsc(p.ref)}\n` : ''}` +
          `${p.mobile ? '📱 телефон' : '💻 компьютер'}\n\n` +
          `Чат: platforma-msk.ru/admin/chat`
        sendTG(text).catch(() => {})
      }
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
