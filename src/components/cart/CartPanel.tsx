'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useUI } from '@/context/UIContext'
import { fmt } from '@/lib/price'
import { CASHBACK_RATE } from '@/lib/constants'

export function CartPanel() {
  const { items, remove, setQty, total, loyalty } = useCart()
  const { cartOpen, openCheckout, closeCart } = useUI()

  // Ссылки на карточки товаров (по SKU) — чтобы из корзины можно было открыть товар
  const [links, setLinks] = useState<Record<string, string>>({})
  const skuKey = items.map(i => i.sku).join('|')
  useEffect(() => {
    if (!cartOpen || !skuKey) return
    let alive = true
    fetch('/api/product-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skus: skuKey.split('|') }),
    })
      .then(r => r.json())
      .then(d => { if (alive && d?.links) setLinks(d.links) })
      .catch(() => {})
    return () => { alive = false }
  }, [cartOpen, skuKey])

  const cashback = Math.round(total * CASHBACK_RATE)
  const lcBal = loyalty ? Math.min(loyalty.balance, total) : 0
  const finalTotal = Math.max(0, total - lcBal)

  if (!cartOpen) return null

  return (
    <>
      <div className="cart-overlay" onClick={closeCart} />
      <aside className="cart-panel">
        <div className="chdr">
          <span className="ctitle">Корзина</span>
          <button className="cclose" onClick={closeCart}>✕</button>
        </div>
        <div className="citems">
          {items.length === 0
            ? <div className="cempty">Корзина пуста</div>
            : items.map((item, index) => (
              <div key={item.sku} className="crow">
                {item.img && (links[item.sku]
                  ? <Link href={links[item.sku]} onClick={closeCart}><img src={item.img} alt={item.title} className="cimg" /></Link>
                  : <img src={item.img} alt={item.title} className="cimg" />)}
                <div className="cinfo">
                  <div className="ctit">
                    {links[item.sku]
                      ? <Link href={links[item.sku]} onClick={closeCart} style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'var(--border)', textUnderlineOffset: 3 }}>{item.title}</Link>
                      : item.title}
                  </div>
                  <div className="cprice">{fmt(item.price)} ₽</div>
                  <div className="cqty">
                    <button onClick={() => setQty(index, item.qty - 1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => setQty(index, item.qty + 1)}>+</button>
                  </div>
                </div>
                <button className="cremove" onClick={() => remove(index)}>✕</button>
              </div>
            ))
          }
        </div>

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
      </aside>
    </>
  )
}
