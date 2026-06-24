'use client'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useUI } from '@/context/UIContext'
import { fmt } from '@/lib/price'
import { CASHBACK_RATE } from '@/lib/constants'
import type { CheckoutForm, DeliveryMethod } from '@/types/cart'

const EMPTY: CheckoutForm = {
  name: '', phone: '', email: '', address: '', pvzAddress: '',
  comment: '', callback: false, deliveryMethod: 'pvz',
}

function formatPhone(raw: string): string {
  let v = raw.replace(/\D/g, '')
  if (v.startsWith('8')) v = '7' + v.slice(1)
  if (v.length > 0 && !v.startsWith('7')) v = '7' + v
  v = v.slice(0, 11)
  let out = v.length > 0 ? '+7' : ''
  if (v.length > 1) out += ' (' + v.slice(1, 4)
  if (v.length >= 4) out += ') ' + v.slice(4, 7)
  if (v.length >= 7) out += '-' + v.slice(7, 9)
  if (v.length >= 9) out += '-' + v.slice(9, 11)
  return out
}

export function CheckoutModal() {
  const { items, total, loyalty, clear } = useCart()
  const { checkoutOpen, closeCheckout } = useUI()
  const [form, setForm] = useState<CheckoutForm>(EMPTY)
  const [loading, setLoading] = useState(false)

  if (!checkoutOpen) return null

  const lcBal = loyalty ? Math.min(loyalty.balance, total) : 0
  const finalTotal = Math.max(0, total - lcBal)
  const cashback = Math.round(total * CASHBACK_RATE)
  const set = (patch: Partial<CheckoutForm>) => setForm(f => ({ ...f, ...patch }))

  const submit = async () => {
    if (!form.name || !form.phone) { alert('Заполните имя и телефон'); return }
    setLoading(true)
    await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form, items, total: finalTotal }),
    })
    clear(); closeCheckout(); setForm(EMPTY); setLoading(false)
    alert('Спасибо! Менеджер свяжется с вами.')
  }

  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500'

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={closeCheckout} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--panel)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="font-bold text-lg">Оформление заказа</h2>
            <button onClick={closeCheckout} className="text-[var(--muted)] hover:text-white text-xl">✕</button>
          </div>

          <div className="px-5 py-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--muted)]">Имя *</label>
                <input className={inp} placeholder="Иван Иванов" value={form.name} onChange={e => set({ name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--muted)]">Телефон *</label>
                <input className={inp} placeholder="+7 (___) ___-__-__" value={form.phone}
                  onChange={e => set({ phone: formatPhone(e.target.value) })} inputMode="tel" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--muted)]">Email</label>
              <input className={inp} type="email" placeholder="email@example.com" value={form.email} onChange={e => set({ email: e.target.value })} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-[var(--muted)]">Способ доставки</label>
              <div className="flex gap-2">
                {(['pvz', 'courier'] as DeliveryMethod[]).map(m => (
                  <div key={m} onClick={() => set({ deliveryMethod: m })}
                    className={`flex-1 text-center text-sm py-2 rounded-xl border cursor-pointer transition-colors ${form.deliveryMethod === m ? 'border-white bg-white/10' : 'border-gray-700 hover:border-gray-500'}`}>
                    {m === 'pvz' ? '📦 Пункт выдачи' : '🚚 Курьер'}
                  </div>
                ))}
              </div>
            </div>

            {form.deliveryMethod === 'courier' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--muted)]">Адрес доставки *</label>
                <input className={inp} placeholder="Город, улица, дом, квартира" value={form.address} onChange={e => set({ address: e.target.value })} />
              </div>
            )}
            {form.deliveryMethod === 'pvz' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--muted)]">Адрес ПВЗ *</label>
                <input className={inp} placeholder="Введите адрес пункта выдачи" value={form.pvzAddress} onChange={e => set({ pvzAddress: e.target.value })} />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--muted)]">Комментарий</label>
              <textarea className={inp + ' resize-none h-20'} placeholder="Пожелания..." value={form.comment} onChange={e => set({ comment: e.target.value })} />
            </div>

            <div className="bg-[var(--bg)] rounded-xl p-3 flex flex-col gap-1 text-sm">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-[var(--muted)]">{item.title} × {item.qty}</span>
                  <span>{item.price > 0 ? fmt(item.price * item.qty) + ' ₽' : '—'}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2 border-t border-gray-800 mt-1">
                <span>К оплате</span>
                <span>{fmt(finalTotal)} ₽</span>
              </div>
              {cashback > 0 && (
                <div className="text-xs text-green-400">💳 +{fmt(cashback)} ₽ вернётся на карту PLATFORMA</div>
              )}
            </div>

            <p className="text-xs text-[var(--muted)]">
              Нажимая «Отправить заказ», вы соглашаетесь с{' '}
              <a href="/privacy" target="_blank" className="underline">политикой обработки персональных данных</a> (ФЗ-152)
            </p>

            <button onClick={submit} disabled={loading}
              className="w-full bg-[var(--dark)] text-white font-semibold py-3 rounded-xl hover:opacity-80 transition-opacity disabled:opacity-40">
              {loading ? 'Отправка...' : 'Отправить заказ'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
