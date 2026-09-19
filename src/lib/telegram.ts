import { TG_TOKEN, TG_CHAT_ID, TG_TOKEN_2, TG_CHAT_ID_2 } from './constants'

// Адрес Telegram Bot API. Если сервер не достаёт до api.telegram.org (блокировка у хостера),
// задай TG_API_BASE=https://<твой-ретранслятор> и TG_RELAY_KEY=<секрет> в .env.local.
const TG_API_BASE = (process.env.TG_API_BASE || 'https://api.telegram.org').replace(/\/+$/, '')
const TG_RELAY_KEY = process.env.TG_RELAY_KEY || ''

export function tgUrl(token: string, method: string): string {
  return `${TG_API_BASE}/bot${token}/${method}`
}

export function tgRelayHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return TG_RELAY_KEY ? { ...extra, 'x-relay-key': TG_RELAY_KEY } : extra
}

export function tgEsc(s: string) {
  return String(s || '').replace(/([_*`\[])/g, '\\$1')
}

async function tgRequest(token: string, chatId: string, text: string, markdown: boolean) {
  const res = await fetch(tgUrl(token, 'sendMessage'), {
    method: 'POST',
    headers: tgRelayHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ chat_id: chatId, text, ...(markdown ? { parse_mode: 'Markdown' } : {}) }),
    // Без таймаута зависший коннект к api.telegram.org вешал оформление заказа
    signal: AbortSignal.timeout(8000),
  })
  const body = res.ok ? '' : await res.text().catch(() => '')
  return { ok: res.ok, status: res.status, body }
}

async function sendOne(token: string, chatId: string, text: string): Promise<boolean> {
  if (!token || !chatId) {
    console.error('[PLATFORMA] TG not configured: token or chat_id missing')
    return false
  }
  try {
    let r = await tgRequest(token, chatId, text, true)
    // Ошибка разбора Markdown (400 can't parse entities) не должна терять заказ —
    // повторяем тем же текстом без parse_mode.
    if (!r.ok && r.status === 400 && /parse entities/i.test(r.body)) {
      console.error('[PLATFORMA] TG Markdown parse failed, retry as plain text:', r.body)
      r = await tgRequest(token, chatId, text.replace(/\\([_*`\[])/g, '$1'), false)
    }
    if (!r.ok) console.error(`[PLATFORMA] TG API error ${r.status}:`, r.body)
    return r.ok
  } catch (e) {
    console.error('[PLATFORMA] TG error:', e)
    return false
  }
}

// Отправка в наш чат — полный заказ с контактами
export async function sendTG(text: string): Promise<boolean> {
  return sendOne(TG_TOKEN, TG_CHAT_ID, text)
}

// Отправка в фирму-поставщик — только состав заказа, без контактов клиента
export async function sendTG2(text: string): Promise<boolean> {
  return sendOne(TG_TOKEN_2, TG_CHAT_ID_2, text)
}

// Отправка фото (например, фото дома клиента для заявки на дизайн-проект).
// photo — Blob/File, полученный из FormData запроса.
export async function sendTGPhoto(photo: Blob, caption?: string): Promise<boolean> {
  if (!TG_TOKEN || !TG_CHAT_ID) return false
  try {
    const fd = new FormData()
    fd.append('chat_id', TG_CHAT_ID)
    if (caption) fd.append('caption', caption)
    fd.append('parse_mode', 'Markdown')
    fd.append('photo', photo, 'photo.jpg')
    const res = await fetch(tgUrl(TG_TOKEN, 'sendPhoto'), {
      method: 'POST',
      headers: tgRelayHeaders(),
      body: fd,
      signal: AbortSignal.timeout(15000),
    })
    return res.ok
  } catch (e) {
    console.error('[PLATFORMA] TG photo error:', e)
    return false
  }
}
