import { TG_TOKEN, TG_CHAT_ID } from './constants'

function tgEsc(s: string) {
  return String(s || '').replace(/([_*`\[])/g, '\\$1')
}

export async function sendTG(text: string): Promise<boolean> {
  if (!TG_TOKEN || !TG_CHAT_ID) {
    console.warn('[PLATFORMA] TG config missing')
    return false
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'Markdown' }),
      }
    )
    return res.ok
  } catch (e) {
    console.error('[PLATFORMA] TG error:', e)
    return false
  }
}

export { tgEsc }
