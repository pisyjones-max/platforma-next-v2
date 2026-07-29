'use client'
import { useState, useMemo } from 'react'
import { calcRoofDetailed, type RoofSlopeItem } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { SALE_RATE } from '@/lib/constants'
import type { Product } from '@/types/catalog'
import { CalcRowList, nextCalcId } from './CalcRowList'

const nextId = () => nextCalcId('slope')

interface Props { product?: Product }

function NumBox({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[var(--muted)]">{label}, м</label>
      <input
        type="number"
        step="0.5"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="px-3 py-2 rounded-xl border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500"
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
      <CalcRowList
        title="Скаты (длина × ширина)"
        unit="м"
        items={slopes}
        onAdd={() => setSlopes(s => [...s, { id: nextId(), len: 5, wid: 5 }])}
        onRemove={id => setSlopes(s => (s.length > 1 ? s.filter(x => x.id !== id) : s))}
        onChange={(id, key, val) => setSlopes(s => s.map(x => (x.id === id ? { ...x, [key]: val } : x)))}
        fields={[{ key: 'len', label: 'Длина' }, { key: 'wid', label: 'Ширина' }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NumBox label="Длина конька" value={ridgeLen} onChange={setRidgeLen} />
        <NumBox label="Карнизные свесы" value={eaveLen} onChange={setEaveLen} />
        <NumBox label="Фронтонные свесы" value={vergeLen} onChange={setVergeLen} />
        <NumBox label="Ендова" value={valleyLen} onChange={setValleyLen} />
      </div>

      <div className="flex flex-col gap-1 max-w-[160px]">
        <label className="text-xs text-[var(--muted)]">Запас, %</label>
        <input
          type="number"
          value={margin}
          onChange={e => setMargin(parseFloat(e.target.value) || 0)}
          className="px-3 py-2 rounded-xl border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500"
        />
      </div>

      <div className="bg-[var(--bg)] rounded-xl px-4 py-3 flex flex-col gap-2">
        <div className="text-sm text-[var(--muted)]">
          Площадь кровли: <strong className="text-[var(--text)]">{result.area.toFixed(1)} м²</strong>
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
          Конёк, свесы и ендова — расчётные позиции для ориентира. Точный подбор доборных элементов под вашу кровлю — у нашего специалиста.
        </p>
        {product && (
          <button onClick={handleAdd}
            className="mt-1 self-start text-sm bg-[var(--dark)] text-white px-4 py-2 rounded-xl hover:opacity-80 transition-opacity">
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} шт. материала)`}
          </button>
        )}
      </div>
    </div>
  )
}
