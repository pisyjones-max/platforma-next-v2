import { NextRequest, NextResponse } from 'next/server'
import { sendTG, sendTGPhoto, tgEsc } from '@/lib/telegram'
import { normalizePhone } from '@/lib/phone'

const MAX_PHOTOS = 3
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
  const product = String(fd.get('product') ?? '').slice(0, 300).trim()
  const competitorPrice = String(fd.get('competitorPrice') ?? '').slice(0, 50).trim()
  const comment = String(fd.get('comment') ?? '').slice(0, 800).trim()

  const phone = normalizePhone(phoneRaw)
  if (!phone) return NextResponse.json({ ok: false, error: 'bad_phone' }, { status: 400 })
  if (!name) return NextResponse.json({ ok: false, error: 'bad_name' }, { status: 400 })
  if (!product) return NextResponse.json({ ok: false, error: 'bad_product' }, { status: 400 })

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
    `💰 *Заявка «Перебьём цену» — PLATFORMA*\n\n` +
    `👤 *Имя:* ${tgEsc(name)}\n` +
    `📱 *Телефон:* ${tgEsc(phoneRaw)}\n` +
    `📦 *Товар:* ${tgEsc(product)}\n` +
    (competitorPrice ? `🏷 *Цена конкурента:* ${tgEsc(competitorPrice)}\n` : '') +
    `💬 ${tgEsc(comment || '—')}\n` +
    `📸 *Скрин/прайс:* ${photos.length ? `${photos.length} шт. (ниже)` : 'не приложен'}\n` +
    `🕐 ${new Date().toLocaleString('ru-RU')}`

  const sent = await sendTG(text)

  for (const photo of photos) {
    await sendTGPhoto(photo, `Прайс конкурента — ${tgEsc(name)}, ${tgEsc(phoneRaw)}`)
  }

  return NextResponse.json({ ok: sent })
}
