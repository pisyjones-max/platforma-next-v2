import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_KEY } from '@/lib/constants'
import { kvMget, kvScanKeys, kvSetEx, isKvConfigured } from '@/lib/kv'
import {
  SID_RE, K_ADMIN_ONLINE, PRESENCE_TTL, kPresence, kLog, kRead, kMgrTyping,
  addManagerMessage, isOnline, isTyping, type Presence, type LogMsg,
} from '@/lib/chatStore'

function checkAuth(req: NextRequest): boolean {
  if (!ADMIN_KEY) return false
  const key = req.headers.get('x-admin-key') ?? new URL(req.url).searchParams.get('key')
  return key === ADMIN_KEY
}

const sidFrom = (v: unknown) => {
  const s = String(v ?? '').toLowerCase()
  return SID_RE.test(s) ? s : ''
}

// GET            — список посетителей и диалогов
// GET ?sid=xxxx  — один диалог целиком (и помечаем прочитанным)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isKvConfigured()) return NextResponse.json({ error: 'kv_not_configured' }, { status: 503 })
  try {
    // Пока админка открыта — виджет у посетителей показывает «Онлайн»
    await kvSetEx(K_ADMIN_ONLINE, 1, 45)
    const now = Date.now()
    const sid = sidFrom(new URL(req.url).searchParams.get('sid'))

    if (sid) {
      const [presence, log, readAt] = await kvMget<any>([kPresence(sid), kLog(sid), kRead(sid)])
      await kvSetEx(kRead(sid), now, PRESENCE_TTL)
      const p = presence as Presence | null
      return NextResponse.json({
        sid,
        messages: (log as LogMsg[] | null) ?? [],
        presence: p && { ...p, online: isOnline(p, now), typing: isTyping(p, now) },
      })
    }

    const [pKeys, lKeys] = await Promise.all([kvScanKeys('chatv:*'), kvScanKeys('chatlog:*')])
    const sids = Array.from(new Set([
      ...pKeys.map(k => k.slice('chatv:'.length)),
      ...lKeys.map(k => k.slice('chatlog:'.length)),
    ])).slice(0, 300)

    const [pres, logs, reads] = await Promise.all([
      kvMget<Presence>(sids.map(kPresence)),
      kvMget<LogMsg[]>(sids.map(kLog)),
      kvMget<number>(sids.map(kRead)),
    ])

    const items = sids.map((s, i) => {
      const p = pres[i]
      const log = logs[i] ?? []
      const readAt = Number(reads[i]) || 0
      const last = log[log.length - 1]
      const unread = log.filter(m => m.from === 'visitor' && m.ts > readAt).length
      return {
        sid: s,
        name: p?.name || '',
        page: p?.page || '',
        ref: p?.ref || '',
        mobile: !!p?.mobile,
        firstSeen: p?.firstSeen || 0,
        lastSeen: p?.lastSeen || 0,
        online: p ? isOnline(p, now) : false,
        away: p ? !p.visible : false,
        typing: p ? isTyping(p, now) : false,
        chatOpen: p ? p.chatOpen && isOnline(p, now) : false,
        pagesCount: p?.pages?.length || 0,
        lastMsg: last ? { text: last.text.slice(0, 120), from: last.from, ts: last.ts } : null,
        msgCount: log.length,
        unread,
      }
    })
      // оставляем: тех, кто был на сайте за последние 30 мин, и все диалоги за сутки
      .filter(it => it.online || now - it.lastSeen < 30 * 60_000 || it.msgCount > 0)
      .sort((a, b) =>
        (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0) ||
        (b.online ? 1 : 0) - (a.online ? 1 : 0) ||
        Math.max(b.lastSeen, b.lastMsg?.ts ?? 0) - Math.max(a.lastSeen, a.lastMsg?.ts ?? 0))

    return NextResponse.json({
      now,
      onlineCount: items.filter(i => i.online).length,
      unreadTotal: items.reduce((n, i) => n + i.unread, 0),
      items,
    })
  } catch (e) {
    console.error('[ADMIN] chat list error:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

// POST { action: 'reply' | 'typing', sid, text? }
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isKvConfigured()) return NextResponse.json({ error: 'kv_not_configured' }, { status: 503 })
  try {
    const b = await req.json()
    const sid = sidFrom(b.sid)
    if (!sid) return NextResponse.json({ error: 'bad_sid' }, { status: 400 })
    if (b.action === 'typing') {
      await kvSetEx(kMgrTyping(sid), 1, 6)
      return NextResponse.json({ ok: true })
    }
    if (b.action === 'reply') {
      const text = String(b.text ?? '').trim().slice(0, 2000)
      if (!text) return NextResponse.json({ error: 'empty' }, { status: 400 })
      await addManagerMessage(sid, text)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'bad_action' }, { status: 400 })
  } catch (e) {
    console.error('[ADMIN] chat post error:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
