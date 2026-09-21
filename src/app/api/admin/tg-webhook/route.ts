import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_KEY, TG_TOKEN } from '@/lib/constants'
import { tgUrl, tgRelayHeaders, webhookSecret } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

// Одноразовая установка webhook: открыть /api/admin/tg-webhook?key=ADMIN_KEY
// (запрос к Telegram идёт через ретранслятор, если он настроен)
export async function GET(req: NextRequest) {
  const key = req.headers.get('x-admin-key') ?? new URL(req.url).searchParams.get('key')
  if (!ADMIN_KEY || key !== ADMIN_KEY) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!TG_TOKEN) return NextResponse.json({ error: 'TG_TOKEN не задан' }, { status: 500 })

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'platforma-msk.ru'
  const url = `https://${host}/api/chat/webhook`
  const call = async (method: string, body?: object) => {
    const r = await fetch(tgUrl(TG_TOKEN, method), {
      method: 'POST',
      headers: tgRelayHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(10000),
    })
    return r.json().catch(() => ({ ok: false, status: r.status }))
  }
  try {
    const set = await call('setWebhook', {
      url, secret_token: webhookSecret(), allowed_updates: ['message', 'channel_post'], drop_pending_updates: false,
    })
    const info = await call('getWebhookInfo')
    return NextResponse.json({ url, set, info })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
