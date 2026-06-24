'use client'
import { useCart } from '@/context/CartContext'
import { useUI } from '@/context/UIContext'
import { fmt } from '@/lib/price'
import { CASHBACK_RATE } from '@/lib/constants'

export function CartPanel() {
  const { items, remove, setQty, total, loyalty } = useCart()
  const { cartOpen, closeCart, openCheckout } = useUI()

  if (!cartOpen) return null

  const cashback = Math.round(total * CASHBACK_RATE)
  const lcBal = loyalty ? Math.min(loyalty.balance, total) : 0
  const finalTotal = Math.max(0, total - lcBal)

  return (
    <>
      <div className="covl" onClick={closeCart} />
      <div className="cpanel">
        <div className="cpanel-header">
          <span>Корзина</span>
          <button onClick={closeCart}>✕</button>
        </div>
        {items.length === 0
          ? <div className="cart-empty">Корзина пуста</div>
          : (
            <div className="cart-items">
              {items.map((item, i) => (
                <div key={item.sku + i} className="citem">
                  <div className="citem-title">{item.title}</div>
                  <div className="citem-controls">
                    <button onClick={() => setQty(i, item.qty - 1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => setQty(i, item.qty + 1)}>+</button>
                    <span>{fmt(item.price * item.qty)} ₽</span>
                    <button onClick={() => remove(i)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
        <div className="cart-footer">
          <div className="ctotal"><span>Итого</span><span>{fmt(finalTotal)} ₽</span></div>
          {cashback > 0 && <div className="ccashback">💳 +{fmt(cashback)} ₽ кэшбэк</div>}
          <button className="chkbtn" onClick={openCheckout} disabled={items.length === 0}>
            Оформить заказ →
          </button>
        </div>
      </div>
    </>
  )
}
