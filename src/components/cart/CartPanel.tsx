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
        <div className="cpanel-hdr">
          <span className="cpanel-title">Корзина</span>
          <button className="cpanel-close" onClick={closeCart}>✕</button>
        </div>

        {items.length === 0 ? (
          <div className="cempty">Корзина пуста</div>
        ) : (
          <div className="citems">
            {items.map((item, i) => (
              <div key={item.sku + i} className="cline">
                <div className="cline-title">{item.title}</div>
                <div className="cline-row">
                  <button className="cqbtn" onClick={() => setQty(i, item.qty - 1)}>−</button>
                  <span className="cqval">{item.qty}</span>
                  <button className="cqbtn" onClick={() => setQty(i, item.qty + 1)}>+</button>
                  <span className="cline-price">{fmt(item.price * item.qty)} ₽</span>
                  <button className="crm" onClick={() => remove(i)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cftr">
          <div className="ctotal">
            <span className="ctlbl">Итого</span>
            <span className="ctval">{fmt(finalTotal)} ₽</span>
          </div>
          {cashback > 0 && (
            <div className="ccashback">💳 +{fmt(cashback)} ₽ кэшбэк на карту PLATFORMA</div>
          )}
          <button className="chkbtn" onClick={openCheckout} disabled={items.length === 0}>
            Оформить заказ →
          </button>
        </div>
      </div>
    </>
  )
}
