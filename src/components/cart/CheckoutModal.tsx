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
  const [done, setDone] = useState(false)

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
    clear(); setDone(true); setLoading(false)
  }

  const handleClose = () => { closeCheckout(); setForm(EMPTY); setDone(false) }

  return (
    <>
      <div className="covl2" onClick={handleClose} />
      <div className="covl2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="checkout-panel">
          <div className="co-header">
            <span>Оформление заказа</span>
            <button onClick={handleClose}>✕</button>
          </div>

          {done ? (
            <div className="co-success" style={{ padding: '40px 24px' }}>
              <div className="tick">✅</div>
              <h3>Заказ принят!</h3>
              <p>Менеджер свяжется с вами в течение 15 минут.<br />Спасибо, что выбрали PLATFORMA!</p>
              <button className="co-submit" style={{ marginTop: 24 }} onClick={handleClose}>Закрыть</button>
            </div>
          ) : (
            <div className="coform">
              <div className="frow2">
                <div className="finp-wrap">
                  <label>Имя *</label>
                  <input className="finp" placeholder="Иван Иванов" value={form.name} onChange={e => set({ name: e.target.value })} />
                </div>
                <div className="finp-wrap">
                  <label>Телефон *</label>
                  <input className="finp" placeholder="+7 (___) ___-__-__" value={form.phone}
                    onChange={e => set({ phone: formatPhone(e.target.value) })} inputMode="tel" />
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
                    <div key={m} onClick={() => set({ deliveryMethod: m })}
                      className={`sub-method ${form.deliveryMethod === m ? 'active' : ''}`}>
                      <div className="sm-icon">{m === 'pvz' ? '📦' : '🚚'}</div>
                      {m === 'pvz' ? 'Самовывоз / ПВЗ' : 'Доставка курьером'}
                    </div>
                  ))}
                </div>
              </div>

              {form.deliveryMethod === 'courier' && (
                <div className="finp-wrap">
                  <label>Адрес доставки *</label>
                  <input className="finp" placeholder="Город, улица, дом" value={form.address} onChange={e => set({ address: e.target.value })} />
                </div>
              )}
              {form.deliveryMethod === 'pvz' && (
                <div className="finp-wrap">
                  <label>Адрес пункта выдачи</label>
                  <input className="finp" placeholder="Введите адрес ПВЗ" value={form.pvzAddress} onChange={e => set({ pvzAddress: e.target.value })} />
                </div>
              )}

              <div className="finp-wrap">
                <label>Комментарий</label>
                <textarea className="ftarea" placeholder="Пожелания к заказу..." value={form.comment} onChange={e => set({ comment: e.target.value })} />
              </div>

              <div className="co-items-preview">
                {items.map((item, i) => (
                  <div key={i} className="co-item-line">
                    <span>{item.title} × {item.qty}</span>
                    <span>{item.price > 0 ? fmt(item.price * item.qty) + ' ₽' : '—'}</span>
                  </div>
                ))}
                <div className="co-total-line">
                  <span>К оплате</span>
                  <span>{fmt(finalTotal)} ₽</span>
                </div>
                {cashback > 0 && (
                  <div className="co-cashback-note">💳 +{fmt(cashback)} ₽ вернётся на карту PLATFORMA</div>
                )}
              </div>

              <p className="privacy-note">
                Нажимая «Отправить заказ», вы соглашаетесь с{' '}
                <a href="/privacy" target="_blank">политикой обработки персональных данных</a> (ФЗ-152)
              </p>

              <button onClick={submit} disabled={loading} className="co-submit">
                {loading ? 'Отправка...' : 'Отправить заказ'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
