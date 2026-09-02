'use client'
import { useState, useMemo } from 'react'
import { calcScrewsDetailed, SCREW_PRESETS } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { salePrice } from '@/lib/price'
import type { Product } from '@/types/catalog'

interface Props { product?: Product }

export function ScrewsCalculator({ product }: Props) {
  const { add } = useCart()
  const variant = product?.variants[0]
  const [added, setAdded] = useState(false)
  const [area, setArea] = useState(80)
  const [materialId, setMaterialId] = useState(SCREW_PRESETS[0].id)
  const [customPerM2, setCustomPerM2] = useState(8)
  const [packSize, setPackSize] = useState(variant?.pack_quantity ?? 250)

  const result = useMemo(
    () => calcScrewsDetailed({ area, materialId, customPerM2, packSize }, variant?.pack_quantity ?? 250),
    [area, materialId, customPerM2, packSize, variant]
  )

  const handleAdd = () => {
    if (!product || !variant) return
    const fp = salePrice(variant.price)
    add({
      sku: variant.sku,
      title: `${product.title} × ${result.qty} шт.`,
      price: fp,
      img: imgUrl(variant.images?.[0] ?? ''),
      qty: result.qty,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="calcw-stack">
      <div className="calcw-grid">
        <div className="calcw-field" style={{ gridColumn: 'span 2' }}>
          <label>Материал монтажа</label>
          <select value={materialId} onChange={e => setMaterialId(e.target.value)} className="calcw-select">
            {SCREW_PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.label}{p.id !== 'custom' ? ` — ${p.perM2} шт/м²` : ''}</option>
            ))}
          </select>
        </div>
        <div className="calcw-field">
          <label>Площадь, м²</label>
          <input
            type="number" value={area}
            onChange={e => setArea(parseFloat(e.target.value) || 0)}
            className="calcw-input"
          />
        </div>
        {materialId === 'custom' && (
          <div className="calcw-field">
            <label>Расход, шт/м²</label>
            <input
              type="number" value={customPerM2}
              onChange={e => setCustomPerM2(parseFloat(e.target.value) || 0)}
              className="calcw-input"
            />
          </div>
        )}
        <div className="calcw-field">
          <label>Штук в упаковке</label>
          <input
            type="number" value={packSize}
            onChange={e => setPackSize(parseFloat(e.target.value) || 1)}
            className="calcw-input"
          />
        </div>
      </div>

      <div className="calcw-result calcw-result-row">
        <div className="calcw-result-area">
          {Math.round(result.area)} шт. <span style={{ color: 'var(--muted)' }}>(норма {result.perM2} шт/м²)</span>
          <span style={{ margin: '0 8px', color: 'var(--muted)' }}>·</span>
          <strong>{result.qty} {result.qtyLabel}</strong>
        </div>
        {product && (
          <button onClick={handleAdd} className="calcw-primary-btn" style={{ marginTop: 0 }}>
            {added ? '✓ Добавлено!' : '+ В корзину'}
          </button>
        )}
      </div>
    </div>
  )
}
