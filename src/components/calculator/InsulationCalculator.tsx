'use client'
import { useState, useMemo } from 'react'
import { calcInsulationDetailed, type InsulationZoneItem } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { salePrice } from '@/lib/price'
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
      <div className="calcw-section">
        <div className="calcw-section-title">Площадь по конструкциям</div>
        {zones.map(z => (
          <div key={z.id} className="calcw-row">
            <span className="calcw-zone-label">{z.label}</span>
            <span className="calcw-row" style={{ gap: 6 }}>
              <input
                type="number" step="1" value={z.area}
                onChange={e => setZone(z.id, 'area', parseFloat(e.target.value) || 0)}
                title="Площадь, м²"
                className="calcw-input calcw-narrow"
              />
              <span className="calcw-unit">м²</span>
            </span>
            <span className="calcw-row" style={{ gap: 6 }}>
              <input
                type="number" step="1" min={1} value={z.layers}
                onChange={e => setZone(z.id, 'layers', parseFloat(e.target.value) || 1)}
                title="Слоёв"
                className="calcw-input calcw-xnarrow"
              />
              <span className="calcw-unit">сл.</span>
            </span>
            {zones.length > 1 && (
              <button onClick={() => removeZone(z.id)} aria-label="Удалить" className="calcw-del">✕</button>
            )}
          </div>
        ))}
        <button onClick={addZone} className="calcw-add-link">+ добавить зону</button>
      </div>

      <div className="calcw-grid" style={{ maxWidth: 320 }}>
        <div className="calcw-field">
          <label>Плит в упаковке</label>
          <input
            type="number" value={packSize}
            onChange={e => setPackSize(parseFloat(e.target.value) || 1)}
            className="calcw-input"
          />
        </div>
        <div className="calcw-field">
          <label>Запас, %</label>
          <input
            type="number" value={margin}
            onChange={e => setMargin(parseFloat(e.target.value) || 0)}
            className="calcw-input"
          />
        </div>
      </div>

      <div className="calcw-result">
        <div className="calcw-result-area">
          Суммарная площадь с учётом слоёв: <strong>{result.area.toFixed(1)} м²</strong>
        </div>
        <div className="calcw-bom">
          {result.bom.map((b, i) => (
            <div key={i} className="calcw-bom-row">
              <span>{b.label}</span>
              <strong>{b.qty} {b.unit}</strong>
            </div>
          ))}
        </div>
        <p className="calcw-note">
          Расчёт по каждой конструкции — отдельно, т.к. у стен, кровли и пола обычно разное число слоёв утеплителя.
        </p>
        {product && (
          <button onClick={handleAdd} className="calcw-primary-btn">
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} уп.)`}
          </button>
        )}
      </div>
    </div>
  )
}
