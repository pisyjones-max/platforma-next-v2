import { NextRequest, NextResponse } from 'next/server'
import { kvSet, kvGet, isKvConfigured } from '@/lib/kv'
import { ADMIN_KEY, TG_TOKEN, TG_CHAT_ID, TG_TOKEN_2, TG_CHAT_ID_2 } from '@/lib/constants'

function checkAuth(req: NextRequest): boolean {
  if (!ADMIN_KEY) return false
  const key = req.headers.get('x-admin-key') ?? new URL(req.url).searchParams.get('key')
  return key === ADMIN_KEY
}

// Проверяет пару токен+chat_id: getChat не отправляет сообщение в чат,
// просто спрашивает у Telegram "видишь ли ты этот chat_id этим ботом" —
// безопасно дергать без спама в чат.
async function checkTelegramPair(token: string, chatId: string) {
  if (!token || !chatId) {
    return { tokenSet: !!token, chatIdSet: !!chatId, ok: false, error: 'not_configured' as const }
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId)}`, {
      cache: 'no-store',
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      return { tokenSet: true, chatIdSet: true, ok: false, error: data?.description ?? `http_${res.status}` }
    }
    return { tokenSet: true, chatIdSet: true, ok: true, chatTitle: data.result?.title ?? data.result?.first_name }
  } catch (e) {
    return { tokenSet: true, chatIdSet: true, ok: false, error: e instanceof Error ? e.message : 'fetch_failed' }
  }
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const kv = { configured: isKvConfigured(), roundtripOk: false as boolean, error: undefined as string | undefined }
  if (kv.configured) {
    try {
      const probe = { ts: Date.now() }
      await kvSet('diag:health', probe)
      const back = await kvGet<{ ts: number }>('diag:health')
      kv.roundtripOk = back?.ts === probe.ts
      if (!kv.roundtripOk) kv.error = 'roundtrip_mismatch'
    } catch (e) {
      kv.error = e instanceof Error ? e.message : 'kv_failed'
    }
  }

  const [telegramMain, telegramSupplier] = await Promise.all([
    checkTelegramPair(TG_TOKEN, TG_CHAT_ID),
    checkTelegramPair(TG_TOKEN_2, TG_CHAT_ID_2),
  ])

  return NextResponse.json({
    kv,
    telegram_main_chat: telegramMain,     // куда падают заказы клиентов и новые карты
    telegram_supplier_chat: telegramSupplier, // куда падает состав заказа для поставщика
    checkedAt: new Date().toISOString(),
  })
}
