'use client'
import { useState, useMemo } from 'react'
import { calcSiding, type WallItem, type OpeningItem, type CornerItem } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { SALE_RATE } from '@/lib/constants'
import type { Product } from '@/types/catalog'

let uidCounter = 0
const nextId = () => `siding_${Date.now()}_${uidCounter++}`

interface Props { product?: Product }

interface FieldDef<T> { key: keyof T; label: string }

function RowList<T extends { id: string }>({
  title, items, onAdd, onRemove, onChange, fields, unit,
}: {
  title: string
  items: T[]
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: (id: string, key: keyof T, val: number) => void
  fields: FieldDef<T>[]
  unit: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-[var(--muted)]">{title}</div>
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-2">
          {fields.map(f => (
            <input
              key={String(f.key)}
              type="number"
              step="0.1"
              value={item[f.key] as unknown as number}
              onChange={e => onChange(item.id, f.key, parseFloat(e.target.value) || 0)}
              title={f.label}
              className="w-20 px-2 py-1.5 rounded-lg border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500"
            />
          ))}
          <span className="text-xs text-[var(--muted)]">{unit}</span>
          {items.length > 1 && (
            <button onClick={() => onRemove(item.id)}
              className="ml-auto text-xs text-red-400 hover:text-red-300 px-1">✕</button>
          )}
        </div>
      ))}
      <button onClick={onAdd} className="self-start text-xs text-[var(--accent)] hover:underline">
        + добавить
      </button>
    </div>
  )
}

export function SidingCalculator({ product }: Props) {
  const { add } = useCart()
  const variant = product?.variants[0]
  const [added, setAdded] = useState(false)
  const [margin, setMargin] = useState(10)
  const [walls, setWalls] = useState<WallItem[]>([{ id: nextId(), w: 10, h: 3 }])
  const [openings, setOpenings] = useState<OpeningItem[]>([{ id: nextId(), w: 1.2, h: 1.5 }])
  const [outerCorners, setOuterCorners] = useState<CornerItem[]>([{ id: nextId(), h: 3 }])
  const [innerCorners, setInnerCorners] = useState<CornerItem[]>([])

  const result = useMemo(
    () => calcSiding(
      { walls, openings, outerCorners, innerCorners, margin },
      variant?.sku_name ?? '',
      variant?.pack_quantity ?? 1
    ),
    [walls, openings, outerCorners, innerCorners, margin, variant]
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
      <div className="grid sm:grid-cols-2 gap-4">
        <RowList
          title="Стены (ширина × высота)"
          unit="м"
          items={walls}
          onAdd={() => setWalls(w => [...w, { id: nextId(), w: 5, h: 3 }])}
          onRemove={id => setWalls(w => (w.length > 1 ? w.filter(x => x.id !== id) : w))}
          onChange={(id, key, val) => setWalls(w => w.map(x => (x.id === id ? { ...x, [key]: val } : x)))}
          fields={[{ key: 'w', label: 'Ширина' }, { key: 'h', label: 'Высота' }]}
        />
        <RowList
          title="Проёмы: окна/двери (ширина × высота)"
          unit="м"
          items={openings}
          onAdd={() => setOpenings(o => [...o, { id: nextId(), w: 1, h: 1 }])}
          onRemove={id => setOpenings(o => (o.length > 1 ? o.filter(x => x.id !== id) : o))}
          onChange={(id, key, val) => setOpenings(o => o.map(x => (x.id === id ? { ...x, [key]: val } : x)))}
          fields={[{ key: 'w', label: 'Ширина' }, { key: 'h', label: 'Высота' }]}
        />
        <RowList
          title="Наружные углы (высота каждого)"
          unit="м"
          items={outerCorners}
          onAdd={() => setOuterCorners(c => [...c, { id: nextId(), h: 3 }])}
          onRemove={id => setOuterCorners(c => c.filter(x => x.id !== id))}
          onChange={(id, key, val) => setOuterCorners(c => c.map(x => (x.id === id ? { ...x, [key]: val } : x)))}
          fields={[{ key: 'h', label: 'Высота' }]}
        />
        <RowList
          title="Внутренние углы (высота каждого)"
          unit="м"
          items={innerCorners}
          onAdd={() => setInnerCorners(c => [...c, { id: nextId(), h: 3 }])}
          onRemove={id => setInnerCorners(c => c.filter(x => x.id !== id))}
          onChange={(id, key, val) => setInnerCorners(c => c.map(x => (x.id === id ? { ...x, [key]: val } : x)))}
          fields={[{ key: 'h', label: 'Высота' }]}
        />
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
          Чистая площадь стен: <strong className="text-[var(--text)]">{result.area.toFixed(1)} м²</strong>
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
          Углы и стартовая планка — расчётные позиции для ориентира. Точный подбор комплектующих под вашу коллекцию — у нашего специалиста.
        </p>
        {product && (
          <button onClick={handleAdd}
            className="mt-1 self-start text-sm bg-[var(--dark)] text-white px-4 py-2 rounded-xl hover:opacity-80 transition-opacity">
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} уп. панелей)`}
          </button>
        )}
      </div>
    </div>
  )
}
