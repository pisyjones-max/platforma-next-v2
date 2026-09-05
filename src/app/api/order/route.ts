import { NextRequest, NextResponse } from 'next/server'
import { sendTG, sendTG2, tgEsc } from '@/lib/telegram'
import { fmt } from '@/lib/price'
import type { CartItem, CheckoutForm } from '@/types/cart'
import { kvGet, kvSet, isKvConfigured } from '@/lib/kv'
import { normalizePhone } from '@/lib/phone'
import { cashbackRateFor, type CardRecord } from '@/lib/loyaltyEngine'

export async function POST(req: NextRequest) {
  const { form, items, total }: { form: CheckoutForm; items: CartItem[]; total: number } = await req.json()

  const lines = items.map(i => `— ${tgEsc(i.title)} × ${i.qty} = ${fmt(i.price * i.qty)} ₽`).join('\n')

  const delivery = form.deliveryMethod === 'pvz'
    ? `ПВЗ: ${tgEsc(form.pvzAddress || 'не выбран')}`
    : `Курьер: ${tgEsc(form.address)}`

  // --- Наш чат: полная информация с контактами ---
  const textFull =
    `🛒 *Новый заказ — PLATFORMA*\n\n` +
    `👤 *Имя:* ${tgEsc(form.name)}\n` +
    `📱 *Телефон:* ${tgEsc(form.phone)}\n` +
    `📧 *Email:* ${tgEsc(form.email || '—')}\n` +
    `🚚 *Доставка:* ${delivery}\n\n` +
    `📦 *Состав:*\n${lines}\n\n` +
    `💰 *Сумма:* ${fmt(total)} ₽\n` +
    `💬 ${tgEsc(form.comment || '—')}\n` +
    `🕐 ${new Date().toLocaleString('ru-RU')}`

  // --- Фирма-поставщик: только состав, без контактов клиента ---
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

  // Начисление прогрессивного кэшбэка, если у клиента уже есть карта лояльности.
  // Списание баллов остаётся ручным (менеджер, /admin/cards) — здесь только начисление,
  // это не меняет ценовую механику заказа и не требует ФАС-чувствительной формулы скидки.
  if (isKvConfigured()) {
    try {
      const p = normalizePhone(form.phone)
      if (p) {
        const rec = await kvGet<CardRecord>(`card:${p}`)
        if (rec) {
          const purchaseNumber = (rec.purchases ?? 0) + 1
          const rate = cashbackRateFor(purchaseNumber)
          const cashback = Math.round(total * rate)
          await kvSet(`card:${p}`, {
            ...rec,
            purchases: purchaseNumber,
            points: (rec.points ?? 0) + cashback,
            lastActivityAt: Date.now(), // новая покупка сбрасывает таймер сгорания баллов
          })
        }
      }
    } catch (e) {
      console.error('[ORDER] cashback accrual error:', e) // не блокируем оформление заказа
    }
  }

  return NextResponse.json({ ok, finalTotal: total })
}
