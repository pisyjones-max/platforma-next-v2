'use client'
import { useState, useMemo } from 'react'
import { calcScrewsDetailed, SCREW_PRESETS } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { SALE_RATE } from '@/lib/constants'
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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs text-[var(--muted)]">Материал монтажа</label>
          <select
            value={materialId}
            onChange={e => setMaterialId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500"
          >
            {SCREW_PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.label}{p.id !== 'custom' ? ` — ${p.perM2} шт/м²` : ''}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)]">Площадь, м²</label>
          <input
            type="number" value={area}
            onChange={e => setArea(parseFloat(e.target.value) || 0)}
            className="px-3 py-2 rounded-xl border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500"
          />
        </div>
        {materialId === 'custom' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)]">Расход, шт/м²</label>
            <input
              type="number" value={customPerM2}
              onChange={e => setCustomPerM2(parseFloat(e.target.value) || 0)}
              className="px-3 py-2 rounded-xl border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500"
            />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)]">Штук в упаковке</label>
          <input
            type="number" value={packSize}
            onChange={e => setPackSize(parseFloat(e.target.value) || 1)}
            className="px-3 py-2 rounded-xl border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between bg-[var(--bg)] rounded-xl px-4 py-3">
        <div className="text-sm">
          {Math.round(result.area)} шт. <span className="text-[var(--muted)]">(норма {result.perM2} шт/м²)</span>
          <span className="mx-2 text-[var(--muted)]">·</span>
          <strong>{result.qty} {result.qtyLabel}</strong>
        </div>
        {product && (
          <button onClick={handleAdd}
            className="text-sm bg-[var(--dark)] text-white px-4 py-2 rounded-xl hover:opacity-80 transition-opacity">
            {added ? '✓ Добавлено!' : '+ В корзину'}
          </button>
        )}
      </div>
    </div>
  )
}
