'use client'
import { useState, useMemo } from 'react'
import { calcScrewsDetailed, SCREW_PRESETS } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { SALE_RATE } from '@/lib/constants'
import type { Product } from '@/types/catalog'
import { CALC_LABEL_CLS, CALC_INPUT_CLS, CALC_RESULT_PANEL_CLS, CALC_PRIMARY_BTN_CLS } from './CalcRowList'

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
    const fp = Math.round(variant.price * SALE_RATE)
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
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={CALC_LABEL_CLS}>Материал монтажа</label>
          <select
            value={materialId}
            onChange={e => setMaterialId(e.target.value)}
            className={CALC_INPUT_CLS}
          >
            {SCREW_PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.label}{p.id !== 'custom' ? ` — ${p.perM2} шт/м²` : ''}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={CALC_LABEL_CLS}>Площадь, м²</label>
          <input
            type="number" value={area}
            onChange={e => setArea(parseFloat(e.target.value) || 0)}
            className={CALC_INPUT_CLS}
          />
        </div>
        {materialId === 'custom' && (
          <div className="flex flex-col gap-1.5">
            <label className={CALC_LABEL_CLS}>Расход, шт/м²</label>
            <input
              type="number" value={customPerM2}
              onChange={e => setCustomPerM2(parseFloat(e.target.value) || 0)}
              className={CALC_INPUT_CLS}
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className={CALC_LABEL_CLS}>Штук в упаковке</label>
          <input
            type="number" value={packSize}
            onChange={e => setPackSize(parseFloat(e.target.value) || 1)}
            className={CALC_INPUT_CLS}
          />
        </div>
      </div>

      <div className={`${CALC_RESULT_PANEL_CLS} sm:flex-row sm:items-center sm:justify-between`}>
        <div className="text-[13px] text-[var(--text)]">
          {Math.round(result.area)} шт. <span className="text-[var(--muted)]">(норма {result.perM2} шт/м²)</span>
          <span className="mx-2 text-[var(--muted)]">·</span>
          <strong className="text-[var(--dark)]">{result.qty} {result.qtyLabel}</strong>
        </div>
        {product && (
          <button onClick={handleAdd} className={`${CALC_PRIMARY_BTN_CLS} mt-0`}>
            {added ? '✓ Добавлено!' : '+ В корзину'}
          </button>
        )}
      </div>
    </div>
  )
}
