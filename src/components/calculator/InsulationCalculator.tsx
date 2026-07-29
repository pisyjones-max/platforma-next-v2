'use client'
import { useState, useMemo } from 'react'
import { calcInsulationDetailed, type InsulationZoneItem } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { SALE_RATE } from '@/lib/constants'
import type { Product } from '@/types/catalog'
import {
  nextCalcId,
  CALC_LABEL_CLS, CALC_INPUT_CLS, CALC_UNIT_CLS, CALC_ADD_LINK_CLS, CALC_DEL_BTN_CLS,
  CALC_RESULT_PANEL_CLS, CALC_PRIMARY_BTN_CLS, CALC_HEADFONT,
} from './CalcRowList'

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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <div className={CALC_LABEL_CLS}>Площадь по конструкциям</div>
        {zones.map(z => (
          <div key={z.id} className="flex flex-wrap items-center gap-2">
            <span className="w-full text-[13px] text-[var(--text)] sm:w-36 sm:shrink-0 sm:truncate">{z.label}</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number" step="1" value={z.area}
                onChange={e => setZone(z.id, 'area', parseFloat(e.target.value) || 0)}
                title="Площадь, м²"
                className={`${CALC_INPUT_CLS} w-[88px]`}
              />
              <span className={CALC_UNIT_CLS}>м²</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number" step="1" min={1} value={z.layers}
                onChange={e => setZone(z.id, 'layers', parseFloat(e.target.value) || 1)}
                title="Слоёв"
                className={`${CALC_INPUT_CLS} w-[64px]`}
              />
              <span className={CALC_UNIT_CLS}>сл.</span>
            </div>
            {zones.length > 1 && (
              <button onClick={() => removeZone(z.id)} aria-label="Удалить" className={CALC_DEL_BTN_CLS}>✕</button>
            )}
          </div>
        ))}
        <button onClick={addZone} className={CALC_ADD_LINK_CLS}>+ добавить зону</button>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-[320px]">
        <div className="flex flex-col gap-1.5">
          <label className={CALC_LABEL_CLS}>Плит в упаковке</label>
          <input
            type="number" value={packSize}
            onChange={e => setPackSize(parseFloat(e.target.value) || 1)}
            className={CALC_INPUT_CLS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={CALC_LABEL_CLS}>Запас, %</label>
          <input
            type="number" value={margin}
            onChange={e => setMargin(parseFloat(e.target.value) || 0)}
            className={CALC_INPUT_CLS}
          />
        </div>
      </div>

      <div className={CALC_RESULT_PANEL_CLS}>
        <div className="text-[13px] text-[var(--muted)]">
          Суммарная площадь с учётом слоёв:{' '}
          <strong style={CALC_HEADFONT} className="text-[15px] text-[var(--dark)]">
            {result.area.toFixed(1)} м²
          </strong>
        </div>
        <div className="flex flex-col gap-1.5 text-[13px] text-[var(--text)]">
          {result.bom.map((b, i) => (
            <div key={i} className="flex justify-between gap-3">
              <span>{b.label}</span>
              <strong className="text-[var(--dark)]">{b.qty} {b.unit}</strong>
            </div>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-[var(--muted)]">
          Расчёт по каждой конструкции — отдельно, т.к. у стен, кровли и пола обычно разное число слоёв утеплителя.
        </p>
        {product && (
          <button onClick={handleAdd} className={CALC_PRIMARY_BTN_CLS}>
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} уп.)`}
          </button>
        )}
      </div>
    </div>
  )
}
