'use client'
import { useState, useMemo } from 'react'
import { calcInsulationDetailed, type InsulationZoneItem } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { SALE_RATE } from '@/lib/constants'
import type { Product } from '@/types/catalog'
import { nextCalcId } from './CalcRowList'

const nextId = () => nextCalcId('zone')

interface Props { product?: Product }

let extraZoneCounter = 0

export function InsulationCalculator({ product }: Props) {
  const { add } = useCart()
  const variant = product?.variants[0]
  const [added, setAdded] = useState(false)
  const [margin, setMargin] = useState(10)
  const [packSize, setPackSize] = useState(variant?.pack_quantity ?? 1)
  const [zones, setZones] = useState<InsulationZoneItem[]>([
    { id: nextId(), label: 'Стены', area: 60, layers: 1 },
    { id: nextId(), label: 'Кровля / скаты', area: 60, layers: 2 },
    { id: nextId(), label: 'Пол / перекрытие', area: 60, layers: 1 },
  ])

  const result = useMemo(
    () => calcInsulationDetailed({ zones, packSize, margin }, variant?.sku_name ?? '', variant?.pack_quantity ?? 1),
    [zones, packSize, margin, variant]
  )

  const setZone = (id: string, key: 'area' | 'layers', val: number) =>
    setZones(z => z.map(x => (x.id === id ? { ...x, [key]: val } : x)))

  const addZone = () => {
    extraZoneCounter++
    setZones(z => [...z, { id: nextId(), label: `Доп. зона ${extraZoneCounter}`, area: 20, layers: 1 }])
  }
  const removeZone = (id: string) => setZones(z => (z.length > 1 ? z.filter(x => x.id !== id) : z))

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
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold text-[var(--muted)]">Площадь по конструкциям</div>
        {zones.map(z => (
          <div key={z.id} className="flex items-center gap-2">
            <span className="text-sm w-36 shrink-0 truncate">{z.label}</span>
            <input
              type="number" step="1" value={z.area}
              onChange={e => setZone(z.id, 'area', parseFloat(e.target.value) || 0)}
              title="Площадь, м²"
              className="w-24 px-2 py-1.5 rounded-lg border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500"
            />
            <span className="text-xs text-[var(--muted)]">м²</span>
            <input
              type="number" step="1" min={1} value={z.layers}
              onChange={e => setZone(z.id, 'layers', parseFloat(e.target.value) || 1)}
              title="Слоёв"
              className="w-16 px-2 py-1.5 rounded-lg border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500"
            />
            <span className="text-xs text-[var(--muted)]">сл.</span>
            {zones.length > 1 && (
              <button onClick={() => removeZone(z.id)}
                className="ml-auto text-xs text-red-400 hover:text-red-300 px-1">✕</button>
            )}
          </div>
        ))}
        <button onClick={addZone} className="self-start text-xs text-[var(--accent)] hover:underline">
          + добавить зону
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-[340px]">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)]">Плит в упаковке</label>
          <input
            type="number" value={packSize}
            onChange={e => setPackSize(parseFloat(e.target.value) || 1)}
            className="px-3 py-2 rounded-xl border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)]">Запас, %</label>
          <input
            type="number" value={margin}
            onChange={e => setMargin(parseFloat(e.target.value) || 0)}
            className="px-3 py-2 rounded-xl border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500"
          />
        </div>
      </div>

      <div className="bg-[var(--bg)] rounded-xl px-4 py-3 flex flex-col gap-2">
        <div className="text-sm text-[var(--muted)]">
          Суммарная площадь с учётом слоёв: <strong className="text-[var(--text)]">{result.area.toFixed(1)} м²</strong>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          {result.bom.map((b, i) => (
            <div key={i} className="flex justify-between">
              <span>{b.label}</span>
              <strong>{b.qty} {b.unit}</strong>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[var(--muted)]">
          Расчёт по каждой конструкции — отдельно, т.к. у стен, кровли и пола обычно разное число слоёв утеплителя.
        </p>
        {product && (
          <button onClick={handleAdd}
            className="mt-1 self-start text-sm bg-[var(--dark)] text-white px-4 py-2 rounded-xl hover:opacity-80 transition-opacity">
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} уп.)`}
          </button>
        )}
      </div>
    </div>
  )
}
