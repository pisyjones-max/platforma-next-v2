'use client'
import { useState, useMemo } from 'react'
import { calcRoofDetailed, type RoofSlopeItem } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { salePrice } from '@/lib/price'
import type { Product } from '@/types/catalog'
import { CalcRowList, nextCalcId } from './CalcRowList'

const nextId = () => nextCalcId('slope')

interface Props { product?: Product }

function NumBox({ label, value, onChange, unit = 'м' }: { label: string; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div className="calcw-field">
      <label>{label}, {unit}</label>
      <input
        type="number"
        step="0.5"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="calcw-input"
      />
    </div>
  )
}

export function RoofCalculator({ product }: Props) {
  const { add } = useCart()
  const variant = product?.variants[0]
  const [added, setAdded] = useState(false)
  const [margin, setMargin] = useState(10)
  const [slopes, setSlopes] = useState<RoofSlopeItem[]>([{ id: nextId(), len: 10, wid: 6 }])
  const [ridgeLen, setRidgeLen] = useState(10)
  const [eaveLen, setEaveLen] = useState(20)
  const [vergeLen, setVergeLen] = useState(14)
  const [valleyLen, setValleyLen] = useState(0)

  const result = useMemo(
    () => calcRoofDetailed(
      { slopes, ridgeLen, eaveLen, vergeLen, valleyLen, margin },
      variant?.sku_name ?? '',
      variant?.pack_quantity ?? 1
    ),
    [slopes, ridgeLen, eaveLen, vergeLen, valleyLen, margin, variant]
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
        title="Скаты (длина × ширина)"
        unit="м"
        items={slopes}
        onAdd={() => setSlopes(s => [...s, { id: nextId(), len: 5, wid: 5 }])}
        onRemove={id => setSlopes(s => (s.length > 1 ? s.filter(x => x.id !== id) : s))}
        onChange={(id, key, val) => setSlopes(s => s.map(x => (x.id === id ? { ...x, [key]: val } : x)))}
        fields={[{ key: 'len', label: 'Длина' }, { key: 'wid', label: 'Ширина' }]}
      />

      <div className="calcw-grid">
        <NumBox label="Длина конька" value={ridgeLen} onChange={setRidgeLen} />
        <NumBox label="Карнизные свесы" value={eaveLen} onChange={setEaveLen} />
        <NumBox label="Фронтонные свесы" value={vergeLen} onChange={setVergeLen} />
        <NumBox label="Ендова" value={valleyLen} onChange={setValleyLen} />
      </div>

      <div className="calcw-margin-box">
        <label>Запас, %</label>
        <input
          type="number"
          value={margin}
          onChange={e => setMargin(parseFloat(e.target.value) || 0)}
          className="calcw-input"
        />
      </div>

      <div className="calcw-result">
        <div className="calcw-result-area">
          Площадь кровли: <strong>{result.area.toFixed(1)} м²</strong>
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
          Конёк, свесы и ендова — расчётные позиции для ориентира. Точный подбор доборных элементов под вашу кровлю — у нашего специалиста.
        </p>
        {product && (
          <button onClick={handleAdd} className="calcw-primary-btn">
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} шт. материала)`}
          </button>
        )}
      </div>
    </div>
  )
}
