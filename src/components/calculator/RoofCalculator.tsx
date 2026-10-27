'use client'
import { useState, useMemo } from 'react'
import { calcRoofDetailed, type RoofSlopeItem } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { salePrice } from '@/lib/price'
import type { Product } from '@/types/catalog'
import { CalcBom } from './CalcBom'
import { CalcRowList, nextCalcId } from './CalcRowList'
import { NumInput } from './NumInput'

const nextId = () => nextCalcId('slope')

interface Props { product?: Product; catSlug?: string }

function NumBox({ label, value, onChange, unit = 'м' }: { label: string; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div className="calcw-field">
      <label>{label}, {unit}</label>
      <NumInput
        
        step="0.5"
        value={value}
        onChange={v => onChange(v || 0)}
        className="calcw-input"
      />
    </div>
  )
}

export function RoofCalculator({ product, catSlug }: Props) {
  const { add } = useCart()
  const variant = product?.variants[0]
  const [added, setAdded] = useState(false)
  const [margin, setMargin] = useState(10)
  const [slopes, setSlopes] = useState<RoofSlopeItem[]>([{ id: nextId(), len: 0, wid: 0 }])
  const [ridgeLen, setRidgeLen] = useState(0)
  const [eaveLen, setEaveLen] = useState(0)
  const [vergeLen, setVergeLen] = useState(0)
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
        onAdd={() => setSlopes(s => [...s, { id: nextId(), len: 0, wid: 0 }])}
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
        <NumInput
          
          value={margin}
          onChange={v => setMargin(v || 0)}
          className="calcw-input"
        />
      </div>

      {result.qty < 1 ? (
        <p className="calcw-note">Введите размеры — расчёт появится здесь.</p>
      ) : (
      <div className="calcw-result">
        <div className="calcw-result-area">
          Площадь кровли: <strong>{result.area.toFixed(1)} м²</strong>
        </div>
        <CalcBom bom={result.bom} accessoriesHref={catSlug ? `/catalog/${catSlug}` : undefined} />
        <p className="calcw-note">
          Конёк, свесы и ендова — расчётные позиции для ориентира. Точный подбор доборных элементов под вашу кровлю — у нашего специалиста.
        </p>
        {product && (
          <button onClick={handleAdd} className="calcw-primary-btn">
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} шт. материала)`}
          </button>
        )}
      </div>
      )}
    </div>
  )
}
