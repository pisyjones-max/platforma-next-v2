'use client'
import { useState, useMemo } from 'react'
import { calcGutterDetailed, type GutterRunItem } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { salePrice } from '@/lib/price'
import type { Product } from '@/types/catalog'
import { CalcRowList, nextCalcId } from './CalcRowList'

const nextId = () => nextCalcId('run')

interface Props { product?: Product }

function NumBox({ label, value, onChange, unit = 'м' }: { label: string; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div className="calcw-field">
      <label>{label}, {unit}</label>
      <input
        type="number"
        step="1"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="calcw-input"
      />
    </div>
  )
}

export function GutterCalculator({ product }: Props) {
  const { add } = useCart()
  const variant = product?.variants[0]
  const [added, setAdded] = useState(false)
  const [margin, setMargin] = useState(10)
  const [runs, setRuns] = useState<GutterRunItem[]>([{ id: nextId(), len: 40 }])
  const [outerCorners, setOuterCorners] = useState(2)
  const [innerCorners, setInnerCorners] = useState(2)
  const [funnels, setFunnels] = useState(2)
  const [wallHeight, setWallHeight] = useState(3)
  const [elbowsPerFunnel, setElbowsPerFunnel] = useState(2)

  const result = useMemo(
    () => calcGutterDetailed(
      { runs, outerCorners, innerCorners, funnels, wallHeight, elbowsPerFunnel, margin },
      variant?.sku_name ?? '',
      variant?.pack_quantity ?? 1
    ),
    [runs, outerCorners, innerCorners, funnels, wallHeight, elbowsPerFunnel, margin, variant]
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
      <CalcRowList
        title="Участки жёлоба (длина)"
        unit="м"
        items={runs}
        onAdd={() => setRuns(r => [...r, { id: nextId(), len: 10 }])}
        onRemove={id => setRuns(r => (r.length > 1 ? r.filter(x => x.id !== id) : r))}
        onChange={(id, key, val) => setRuns(r => r.map(x => (x.id === id ? { ...x, [key]: val } : x)))}
        fields={[{ key: 'len', label: 'Длина' }]}
      />

      <div className="calcw-grid">
        <NumBox label="Углы наружные" value={outerCorners} onChange={setOuterCorners} unit="шт" />
        <NumBox label="Углы внутренние" value={innerCorners} onChange={setInnerCorners} unit="шт" />
        <NumBox label="Воронки" value={funnels} onChange={setFunnels} unit="шт" />
        <NumBox label="Высота стены" value={wallHeight} onChange={setWallHeight} />
        <NumBox label="Колен на воронку" value={elbowsPerFunnel} onChange={setElbowsPerFunnel} unit="шт" />
        <NumBox label="Запас" value={margin} onChange={setMargin} unit="%" />
      </div>

      <div className="calcw-result">
        <div className="calcw-result-area">
          Длина жёлоба: <strong>{result.area.toFixed(1)} м</strong>
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
          Углы, воронки, трубы и колена — расчётные позиции для ориентира. Точную схему водоотведения под ваш дом подберёт наш специалист.
        </p>
        {product && (
          <button onClick={handleAdd} className="calcw-primary-btn">
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} шт. жёлоба)`}
          </button>
        )}
      </div>
    </div>
  )
}
