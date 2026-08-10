import { NextRequest, NextResponse } from 'next/server'
import { sendTG, sendTGPhoto, tgEsc } from '@/lib/telegram'
import { kvSet, isKvConfigured } from '@/lib/kv'
import { normalizePhone } from '@/lib/phone'
import { DESIGN_PROJECT_PRICE } from '@/lib/constants'

const MAX_PHOTOS = 5
const MAX_PHOTO_BYTES = 8 * 1024 * 1024 // 8 МБ на файл

export async function POST(req: NextRequest) {
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }

  const name = String(fd.get('name') ?? '').slice(0, 200).trim()
  const phoneRaw = String(fd.get('phone') ?? '')
  const comment = String(fd.get('comment') ?? '').slice(0, 800).trim()
  const material = String(fd.get('material') ?? '').slice(0, 200).trim()

  const phone = normalizePhone(phoneRaw)
  if (!phone) return NextResponse.json({ ok: false, error: 'bad_phone' }, { status: 400 })
  if (!name) return NextResponse.json({ ok: false, error: 'bad_name' }, { status: 400 })

  const photos = fd.getAll('photos').filter((p): p is File => p instanceof File && p.size > 0)
  if (photos.length > MAX_PHOTOS) {
    return NextResponse.json({ ok: false, error: 'too_many_photos' }, { status: 400 })
  }
  for (const p of photos) {
    if (p.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ ok: false, error: 'photo_too_large' }, { status: 400 })
    }
  }

  const text =
    `🏡 *Заявка на бесплатный дизайн-проект — PLATFORMA*\n\n` +
    `👤 *Имя:* ${tgEsc(name)}\n` +
    `📱 *Телефон:* ${tgEsc(phoneRaw)}\n` +
    (material ? `🧱 *Материал:* ${tgEsc(material)}\n` : '') +
    `💬 ${tgEsc(comment || '—')}\n` +
    `📸 *Фото:* ${photos.length ? `${photos.length} шт. (ниже)` : 'не приложены'}\n` +
    `💰 *Стоимость услуги:* ${DESIGN_PROJECT_PRICE} ₽ — бесплатно при оформлении карты лояльности\n` +
    `🕐 ${new Date().toLocaleString('ru-RU')}`

  const sent = await sendTG(text)

  // Фото шлём отдельными сообщениями, чтобы не терять качество/подписи
  for (const photo of photos) {
    await sendTGPhoto(photo, `Фото дома — ${tgEsc(name)}, ${tgEsc(phoneRaw)}`)
  }

  // Запоминаем заявку в KV по номеру телефона — если клиент позже оформит
  // карту лояльности, ей автоматически привяжется бонус на дизайн-проект
  // (см. src/app/api/card/issue/route.ts).
  if (isKvConfigured()) {
    try {
      await kvSet(`designlead:${phone}`, {
        name,
        comment,
        material,
        photosCount: photos.length,
        createdAt: Date.now(),
        status: 'new',
      })
    } catch (e) {
      console.error('[DESIGN-REQUEST] kv error:', e)
    }
  }

  return NextResponse.json({ ok: sent })
}
