'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import { useUI } from '@/context/UIContext'
import { salePrice, fmt } from '@/lib/price'
import type { Product } from '@/types/catalog'

interface Props {
  product: Product | null
  onClose: () => void
}

export function ProductModal({ product, onClose }: Props) {
  const { add } = useCart()
  const { openCart } = useUI()
  const [varIdx, setVarIdx] = useState(0)
  const [imgIdx, setImgIdx] = useState(0)
  const [qty, setQty] = useState(1)

  useEffect(() => { setVarIdx(0); setImgIdx(0); setQty(1) }, [product?.id])

  if (!product) return null

  const v = product.variants[varIdx]
  const fp = salePrice(v.price)
  const imgs = v.images ?? []

  const handleAdd = () => {
    add({
      sku: v.sku,
      title: product.title + (v.color ? ` (${v.color})` : ''),
      price: fp,
      img: imgs[0] ?? '',
      qty,
    })
    onClose()
    openCart()
  }

  return (
    <>
      <div className="moverlay" onClick={onClose} />
      <div className="modal">
        <button className="mclose" onClick={onClose}>✕</button>

        <div className="mgal">
          <div className="mgal-track">
            {imgs.length > 0
              ? imgs.map((src, i) => (
                  <div key={i} className="mgal-slide" style={{ position: 'relative' }}>
                    <Image src={src} alt={product.title} fill sizes="600px"
                      style={{ objectFit: 'contain' }} priority={i === 0} />
                  </div>
                ))
              : <div className="ph-big">📦</div>
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
        </div>

        <div className="minfo">
          <div className="mtitle">{product.title}</div>
          <div className="msku">Арт. {v.sku}</div>

          <div className="mpb">
            {v.price > 0 ? (
              <>
                <span className="mprice">{fmt(fp)} ₽</span>
                <span className="mop">{fmt(v.price)} ₽</span>
                <span className="m-disc-tag">−7%</span>
              </>
            ) : (
              <span className="mprice" style={{ fontSize: 16, color: 'var(--muted)' }}>Цена по запросу</span>
            )}
          </div>

          {product.variants.length > 1 && (
            <div className="vlist">
              {product.variants.map((vv, i) => (
                <button key={i} className={`vbtn ${i === varIdx ? 'active' : ''}`}
                  onClick={() => setVarIdx(i)}>
                  {vv.sku_name ?? vv.color ?? vv.sku}
                </button>
              ))}
            </div>
          )}

          <div className="qrow">
            <button className="qbtn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span className="qval">{qty}</span>
            <button className="qbtn" onClick={() => setQty(q => q + 1)}>+</button>
          </div>

          {product.description && <div className="mdesc">{product.description}</div>}

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
            <button className="madd" onClick={handleAdd}>+ В корзину</button>
          </div>
        </div>
      </div>
    </>
  )
}
