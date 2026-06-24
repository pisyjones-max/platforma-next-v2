import { NextRequest, NextResponse } from 'next/server'
import { sendTG, tgEsc } from '@/lib/telegram'
import { fmt } from '@/lib/price'
import type { CartItem, CheckoutForm } from '@/types/cart'

export async function POST(req: NextRequest) {
  const { form, items, total }: { form: CheckoutForm; items: CartItem[]; total: number } = await req.json()

  const lines = items.map(i => `— ${tgEsc(i.title)} × ${i.qty} = ${fmt(i.price * i.qty)} ₽`).join('\n')
  const delivery = form.deliveryMethod === 'pvz'
    ? `ПВЗ: ${tgEsc(form.pvzAddress || 'не выбран')}`
    : `Курьер: ${tgEsc(form.address)}`

  const text =
    `🛒 *Новый заказ — PLATFORMA*\n\n` +
    `👤 *Имя:* ${tgEsc(form.name)}\n` +
    `📱 *Телефон:* ${tgEsc(form.phone)}\n` +
    `📧 *Email:* ${tgEsc(form.email || '—')}\n` +
    `🚚 *Доставка:* ${delivery}\n\n` +
    `📦 *Состав:*\n${lines}\n\n` +
    `💰 *Итого:* ${fmt(total)} ₽\n` +
    `💬 ${tgEsc(form.comment || '—')}\n` +
    `🕐 ${new Date().toLocaleString('ru-RU')}`

  const ok = await sendTG(text)
  return NextResponse.json({ ok })
}
