'use client'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useUI } from '@/context/UIContext'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { fmt } from '@/lib/price'
import { CASHBACK_RATE } from '@/lib/constants'
import type { CheckoutForm, DeliveryMethod } from '@/types/cart'

const EMPTY: CheckoutForm = {
  name: '', phone: '', email: '', address: '', pvzAddress: '',
  comment: '', callback: false, deliveryMethod: 'pvz',
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

  return (
    <>
      <div className="covl2" onClick={closeCheckout} />
      <div className="checkout-panel">
        <div className="co-header">
          <h2>Оформление заказа</h2>
          <button onClick={closeCheckout}>✕</button>
        </div>
        <div className="coform">
          <div className="frow2">
            <div className="finp-wrap">
              <label>Имя *</label>
              <input className="finp" placeholder="Иван Иванов" value={form.name} onChange={e => set({ name: e.target.value })} />
            </div>
            <div className="finp-wrap">
              <label>Телефон *</label>
              <PhoneInput className="finp" value={form.phone} onChange={v => set({ phone: v })} />
            </div>
          </div>
          <div className="finp-wrap">
            <label>Email</label>
            <input className="finp" type="email" placeholder="email@example.com" value={form.email} onChange={e => set({ email: e.target.value })} />
          </div>
          <div className="finp-wrap">
            <label>Способ доставки</label>
            <div className="sub-methods">
              {(['pvz', 'courier'] as DeliveryMethod[]).map(m => (
                <div key={m} className={`sub-method${form.deliveryMethod === m ? ' active' : ''}`}
                  onClick={() => set({ deliveryMethod: m })}>
                  {m === 'pvz' ? '📦 Пункт выдачи' : '🚚 Курьер'}
                </div>
              ))}
            </div>
          </div>
          {form.deliveryMethod === 'courier' && (
            <div className="finp-wrap">
              <label>Адрес доставки *</label>
              <input className="finp" placeholder="Город, улица, дом, квартира" value={form.address} onChange={e => set({ address: e.target.value })} />
            </div>
          )}
          {form.deliveryMethod === 'pvz' && (
            <div className="finp-wrap">
              <label>Адрес ПВЗ *</label>
              <input className="finp" placeholder="Введите адрес пункта выдачи" value={form.pvzAddress} onChange={e => set({ pvzAddress: e.target.value })} />
            </div>
          )}
          <div className="finp-wrap">
            <label>Комментарий</label>
            <textarea className="ftarea" placeholder="Пожелания..." value={form.comment} onChange={e => set({ comment: e.target.value })} />
          </div>
          <div className="co-items-preview">
            {items.map((item, i) => (
              <div key={i} className="co-item-line">
                <span>{item.title} × {item.qty}</span>
                <span>{item.price > 0 ? fmt(item.price * item.qty) + ' ₽' : '—'}</span>
              </div>
            ))}
            <div className="co-total-line"><span>К оплате</span><span>{fmt(finalTotal)} ₽</span></div>
            {cashback > 0 && <div className="co-cashback-note">💳 +{fmt(cashback)} ₽ вернётся на карту PLATFORMA</div>}
          </div>
          <p className="privacy-note">
            Нажимая «Отправить заказ», вы соглашаетесь с{' '}
            <a href="/privacy" target="_blank">политикой обработки персональных данных</a> (ФЗ-152)
          </p>
          <button className="co-submit" onClick={submit} disabled={loading}>
            {loading ? 'Отправка...' : 'Отправить заказ'}
          </button>
        </div>
      </div>
    </>
  )
}
