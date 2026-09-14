import { TG_TOKEN, TG_CHAT_ID, TG_TOKEN_2, TG_CHAT_ID_2 } from './constants'

export function tgEsc(s: string) {
  return String(s || '').replace(/([_*`\[])/g, '\\$1')
}

async function sendOne(token: string, chatId: string, text: string): Promise<boolean> {
  if (!token || !chatId) {
    console.error('[PLATFORMA] TG not configured: token or chat_id missing')
    return false
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      }
    )
    if (!res.ok) {
      // Раньше падение на уровне Telegram API (неверный токен, бот не состоит
      // в чате, ошибка парсинга Markdown и т.д.) молча возвращало false —
      // в логах ничего не было видно, заказ выглядел "потерянным без следа".
      const body = await res.text().catch(() => '')
      console.error(`[PLATFORMA] TG API error ${res.status}:`, body)
    }
    return res.ok
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
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: fd,
    })
    return res.ok
  } catch (e) {
    console.error('[PLATFORMA] TG photo error:', e)
    return false
  }
}
