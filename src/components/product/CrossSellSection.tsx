'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { imgUrl } from '@/lib/image'
import { fmt, salePrice } from '@/lib/price'
import { productSlug } from '@/lib/slug'
import { useCart } from '@/context/CartContext'
import { useUI } from '@/context/UIContext'
import type { CrossSellProduct } from '@/lib/crossSell'

interface Props {
  products: CrossSellProduct[]
}

/**
 * Блок "С этим товаром покупают" — он же "Собрать комплект".
 *
 * Строится на тех же правилах, что и раньше (src/lib/crossSell.ts), но теперь
 * каждая позиция — чекбокс с количеством, а не просто карточка-ссылка.
 * По умолчанию ничего не отмечено — пользователь сам выбирает нужные позиции
 * и добавляет их в корзину одной кнопкой.
 *
 * Ничего не рендерит, если рекомендаций нет — как и раньше.
 */
export function CrossSellSection({ products }: Props) {
  const { add } = useCart()
  const { openCart } = useUI()

  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [qty, setQty] = useState<Record<string, number>>(
    () => Object.fromEntries(products.map(p => [p.id, 1])),
  )
  const [justAdded, setJustAdded] = useState(false)

  const rows = useMemo(
    () => products.map(p => ({
      product: p,
      price: salePrice(p.variants[0]?.price ?? 0),
    })),
    [products],
  )

  if (products.length === 0) return null

  const selectedCount = rows.filter(r => selected[r.product.id]).length
  const kitTotal = rows.reduce(
    (sum, r) => selected[r.product.id] ? sum + r.price * (qty[r.product.id] ?? 1) : sum,
    0,
  )

  const toggle = (id: string) => setSelected(s => ({ ...s, [id]: !s[id] }))
  const changeQty = (id: string, delta: number) =>
    setQty(q => ({ ...q, [id]: Math.max(1, (q[id] ?? 1) + delta) }))

  const handleAddKit = () => {
    for (const { product: p, price } of rows) {
      if (!selected[p.id] || price <= 0) continue
      const v = p.variants[0]
      add({ sku: v.sku, title: p.title, price, img: imgUrl(v.images?.[0] ?? ''), qty: qty[p.id] ?? 1 })
    }
    setJustAdded(true)
    openCart()
    setTimeout(() => setJustAdded(false), 2500)
  }

  return (
    <div className="prod-related kit-section">
      <div className="kit-header">
        <div>
          <h2 className="prod-section-title kit-title">С этим товаром покупают</h2>
          <p className="kit-subtitle">Отметьте нужные позиции — соберём комплект и добавим всё сразу</p>
        </div>
      </div>

      <div className="pgrid cross-sell-grid kit-grid">
        {rows.map(({ product: p, price }) => {
          const v = p.variants[0]
          const pid = productSlug(p.id)
          const isSelected = !!selected[p.id]
          const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation() }
          return (
            <div key={p.id} className={`pcard kit-card ${isSelected ? 'kit-card-selected' : ''}`}>
              <label className="kit-check" onClick={stop}>
                <input type="checkbox" checked={isSelected} onChange={() => toggle(p.id)} />
              </label>
              <Link href={`/catalog/${p.catSlug}/${pid}`} className="kit-card-link">
                <div className="pthumb">
                  {v.images?.[0]
                    ? <img src={imgUrl(v.images[0])} alt={p.title} loading="lazy" />
                    : <div className="ph">📦</div>
                  }
                </div>
                <div className="pinfo">
                  <div className="ptitle">{p.title}</div>
                  {price > 0 ? (
                    <div className="pprow">
                      <span className="pp">{fmt(price)} ₽</span>
                      <span className="pop">{fmt(v.price)} ₽</span>
                    </div>
                  ) : (
                    <div className="pprow"><span className="psku">Цена по запросу</span></div>
                  )}
                </div>
              </Link>
              {price > 0 && (
                <div className="pqty" onClick={stop}>
                  <button className="pqty-btn" onClick={() => changeQty(p.id, -1)} aria-label="Уменьшить количество">−</button>
                  <span className="pqty-val">{qty[p.id] ?? 1}</span>
                  <button className="pqty-btn" onClick={() => changeQty(p.id, 1)} aria-label="Увеличить количество">+</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="kit-summary">
        <div className="kit-summary-info">
          {selectedCount > 0
            ? <>Выбрано {selectedCount} {selectedCount === 1 ? 'позиция' : 'позиций'} · Итого <b>{fmt(kitTotal)} ₽</b></>
            : 'Выберите позиции для комплекта'}
        </div>
        <button
          className="kit-add-btn"
          disabled={selectedCount === 0}
          onClick={handleAddKit}
        >
          {justAdded ? '✓ Добавлено в корзину' : `+ Добавить комплект (${selectedCount})`}
        </button>
      </div>
    </div>
  )
}
