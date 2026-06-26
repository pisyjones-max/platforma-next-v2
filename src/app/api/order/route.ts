import { NextRequest, NextResponse } from 'next/server'
import { sendTG, sendTG2, tgEsc } from '@/lib/telegram'
import { fmt } from '@/lib/price'
import { VOLUME_DISCOUNTS } from '@/lib/constants'
import type { CartItem, CheckoutForm } from '@/types/cart'

export async function POST(req: NextRequest) {
  const { form, items, total }: { form: CheckoutForm; items: CartItem[]; total: number } = await req.json()

  // Объёмная скидка
  const volDisc = [...VOLUME_DISCOUNTS].reverse().find(d => total >= d.from)
  const discAmt  = volDisc ? Math.round(total * volDisc.rate) : 0
  const finalAmt = total - discAmt

  const lines = items.map(i => `— ${tgEsc(i.title)} × ${i.qty} = ${fmt(i.price * i.qty)} ₽`).join('\n')

  const delivery = form.deliveryMethod === 'pvz'
    ? `ПВЗ: ${tgEsc(form.pvzAddress || 'не выбран')}`
    : `Курьер: ${tgEsc(form.address)}`

  const discLine = volDisc
    ? `\n🎁 *Скидка от объёма (${volDisc.label}):* −${fmt(discAmt)} ₽ (${volDisc.rate * 100}%)`
    : ''

  // --- Наш чат: полная информация с контактами ---
  const textFull =
    `🛒 *Новый заказ — PLATFORMA*\n\n` +
    `👤 *Имя:* ${tgEsc(form.name)}\n` +
    `📱 *Телефон:* ${tgEsc(form.phone)}\n` +
    `📧 *Email:* ${tgEsc(form.email || '—')}\n` +
    `🚚 *Доставка:* ${delivery}\n\n` +
    `📦 *Состав:*\n${lines}\n\n` +
    `💰 *Сумма:* ${fmt(total)} ₽${discLine}\n` +
    `✅ *К оплате:* ${fmt(finalAmt)} ₽\n` +
    `💬 ${tgEsc(form.comment || '—')}\n` +
    `🕐 ${new Date().toLocaleString('ru-RU')}`

  // --- Фирма-поставщик: только состав, без контактов ---
  const textSupplier =
    `📋 *Заявка на поставку — PLATFORMA*\n\n` +
    `📦 *Состав:*\n${lines}\n\n` +
    `💰 *Сумма заказа:* ${fmt(total)} ₽\n` +
    `🚚 *Тип доставки:* ${form.deliveryMethod === 'pvz' ? 'Самовывоз / ПВЗ' : 'Курьер'}\n` +
    `🕐 ${new Date().toLocaleString('ru-RU')}`

  const [ok] = await Promise.all([
    sendTG(textFull),
    sendTG2(textSupplier),
  ])

  return NextResponse.json({ ok, discount: discAmt, finalTotal: finalAmt })
}
