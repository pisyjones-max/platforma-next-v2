'use client'
import { useState, useMemo } from 'react'
import { calcSheetDetailed, parseSheetSize, type SheetZoneItem } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { salePrice } from '@/lib/price'
import type { Product } from '@/types/catalog'
import { nextCalcId } from './CalcRowList'

const nextId = () => nextCalcId('sheet')

interface Props { product?: Product }

let extraZoneCounter = 0

export function SheetCalculator({ product }: Props) {
  const { add } = useCart()
  const variant = product?.variants[0]
  const size = parseSheetSize(product?.features, product?.title, variant?.sku_name)
  const [added, setAdded] = useState(false)
  const [margin, setMargin] = useState(10)
  const [lenMm, setLenMm] = useState(size.lenMm)
  const [widMm, setWidMm] = useState(size.widMm)
  const [zones, setZones] = useState<SheetZoneItem[]>([
    { id: nextId(), label: 'Стены', area: 40, layers: 1 },
    { id: nextId(), label: 'Потолок', area: 20, layers: 1 },
  ])

  const result = useMemo(
    () => calcSheetDetailed({ zones, lenMm, widMm, margin }),
    [zones, lenMm, widMm, margin]
  )

  const setZone = (id: string, key: 'area' | 'layers', val: number) =>
    setZones(z => z.map(x => (x.id === id ? { ...x, [key]: val } : x)))

  const addZone = () => {
    extraZoneCounter++
    setZones(z => [...z, { id: nextId(), label: `Доп. поверхность ${extraZoneCounter}`, area: 10, layers: 1 }])
  }
  const removeZone = (id: string) => setZones(z => (z.length > 1 ? z.filter(x => x.id !== id) : z))

  const handleAdd = () => {
    if (!product || !variant || result.qty < 1) return
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
        <div className="calcw-section-title">Площадь поверхностей</div>
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
                title="Слоёв обшивки"
                className="calcw-input calcw-xnarrow"
              />
              <span className="calcw-unit">сл.</span>
            </span>
            {zones.length > 1 && (
              <button onClick={() => removeZone(z.id)} aria-label="Удалить" className="calcw-del">✕</button>
            )}
          </div>
        ))}
        <button onClick={addZone} className="calcw-add-link">+ добавить поверхность</button>
      </div>

      <div className="calcw-grid" style={{ maxWidth: 480 }}>
        <div className="calcw-field">
          <label>Длина листа, мм</label>
          <input
            type="number" value={lenMm}
            onChange={e => setLenMm(parseFloat(e.target.value) || 0)}
            className="calcw-input"
          />
        </div>
        <div className="calcw-field">
          <label>Ширина листа, мм</label>
          <input
            type="number" value={widMm}
            onChange={e => setWidMm(parseFloat(e.target.value) || 0)}
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
          Площадь с учётом слоёв и запаса: <strong>{result.area.toFixed(1)} м²</strong>
          {' · '}лист {(result.sheetM2).toFixed(2)} м²
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
          Размер листа подставлен из характеристик товара — если нужен другой формат, поправьте вручную. Каждая поверхность округляется до целых листов, итог — по общей площади.
        </p>
        {product && (
          <button onClick={handleAdd} className="calcw-primary-btn">
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} лист.)`}
          </button>
        )}
      </div>
    </div>
  )
}
