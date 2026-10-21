import { cookies } from 'next/headers'
import { crmTouch, cleanVid, type EventType, type Lead } from './crmStore'

export const VID_COOKIE = 'plt_vid'

/** vid посетителя из куки (её ставит виджет сайта) */
export async function vidFromCookie(): Promise<string> {
  try { return cleanVid((await cookies()).get(VID_COOKIE)?.value) } catch { return '' }
}

/** Записать заявку/форму в CRM к человеку по куке. Ошибки не пробрасываем — форма важнее CRM. */
export async function crmTrackForm(p: {
  type: EventType
  name?: string
  phone?: string
  email?: string
  text?: string
  product?: boolean
}): Promise<Lead | null> {
  try {
    const vid = await vidFromCookie()
    if (!vid) return null
    return await crmTouch({
      vid,
      name: p.name,
      phone: p.phone,
      email: p.email,
      event: { type: p.type, text: p.text },
      counters: p.type === 'order' ? { orders: 1 } : { requests: 1 },
    })
  } catch (e) {
    console.error('[CRM] form track error:', e)
    return null
  }
}
