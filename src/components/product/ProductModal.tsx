'use client'
import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { useUI } from '@/context/UIContext'
import { imgUrl } from '@/lib/image'
import { fmt } from '@/lib/price'
import { SALE_RATE, DISC_LABEL } from '@/lib/constants'
import type { Product } from '@/types/catalog'

interface Props { product: Product | null; onClose: () => void }

export function ProductModal({ product, onClose }: Props) {
  const { add } = useCart()
  const { openCart } = useUI()
  const [varIdx, setVarIdx] = useState(0)
  const [imgIdx, setImgIdx] = useState(0)
  const [qty, setQty] = useState(1)

  useEffect(() => { setVarIdx(0); setImgIdx(0); setQty(1) }, [product?.id])

  if (!product) return null

  const v = product.variants[varIdx]
  const fp = Math.round(v.price * SALE_RATE)
  const imgs = v.images ?? []

  const handleAdd = () => {
    add({
      sku: v.sku,
      title: product.title + (v.color ? ` (${v.color})` : ''),
      price: fp,
      img: imgUrl(imgs[0] ?? ''),
      qty,
    })
    onClose()
    openCart()
  }

  return (
    <div className="moverlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* Галерея */}
        <div className="mgal">
          <button className="mcl" onClick={onClose}>✕</button>
          <div className="mgal-track">
            {imgs.length > 0
              ? imgs.map((src, i) => (
                  <div key={i} className="mgal-slide">
                    <img src={imgUrl(src)} alt={product.title} loading={i === 0 ? 'eager' : 'lazy'} />
                  </div>
                ))
              : <div className="mgal-slide"><span className="ph-big">📦</span></div>
            }
          </div>
          {imgs.length > 1 && (
            <div className="mgal-dots">
              {imgs.map((_, i) => (
                <div key={i} className={`mgal-dot ${i === imgIdx ? 'active' : ''}`}
                  onClick={() => setImgIdx(i)} />
              ))}
            </div>
          )}
          {imgs.length > 1 && (
            <div className="mthbs">
              {imgs.map((src, i) => (
                <div key={i} className={`mthb ${i === imgIdx ? 'active' : ''}`}
                  onClick={() => setImgIdx(i)}>
                  <img src={imgUrl(src)} alt="" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Инфо */}
        <div className="minfo">
          <div className="mtitle">{product.title}</div>
          <div className="msku">Арт. {v.sku}</div>

          <div className="mpb">
            {v.price > 0 ? (
              <>
                <span className="mprice">{fmt(fp)} ₽</span>
                <span className="mop">{fmt(v.price)} ₽</span>
                <span className="m-disc-tag">{DISC_LABEL}</span>
              </>
            ) : (
              <span className="mprice" style={{ fontSize: 16, color: 'var(--muted)' }}>Цена по запросу</span>
            )}
          </div>

          {product.variants.length > 1 && (
            <div>
              <div className="vlabel">Вариант</div>
              <div className="vlist">
                {product.variants.map((vv, i) => (
                  <button key={i} className={`vbtn ${i === varIdx ? 'active' : ''}`}
                    onClick={() => setVarIdx(i)}>
                    {vv.sku_name ?? vv.color ?? vv.sku}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="qrow">
            <div className="vlabel">Кол-во:</div>
            <button className="qbtn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span className="qval">{qty}</span>
            <button className="qbtn" onClick={() => setQty(q => q + 1)}>+</button>
          </div>

          {product.description && (
            <div className="mdesc">{product.description}</div>
          )}

          {Object.keys(product.features ?? {}).length > 0 && (
            <div className="fgrid">
              {Object.entries(product.features!).slice(0, 10).map(([k, val]) => (
                <div key={k} className="frow">
                  <div className="fkey">{k}</div>
                  <div className="fval">{val}</div>
                </div>
              ))}
            </div>
          )}

          <div className="modal-btn-row">
            <button className="madd" onClick={handleAdd} style={{ width: '100%' }}>
              + В корзину
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
