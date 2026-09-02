'use client'
import { useState, useMemo } from 'react'
import { calcSiding, type WallItem, type OpeningItem, type CornerItem } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { salePrice } from '@/lib/price'
import type { Product } from '@/types/catalog'
import { CalcRowList, nextCalcId } from './CalcRowList'

const nextId = () => nextCalcId('siding')

interface Props { product?: Product }

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
      <div className="calcw-cols2">
        <CalcRowList
          title="Стены (ширина × высота)"
          unit="м"
          items={walls}
          onAdd={() => setWalls(w => [...w, { id: nextId(), w: 5, h: 3 }])}
          onRemove={id => setWalls(w => (w.length > 1 ? w.filter(x => x.id !== id) : w))}
          onChange={(id, key, val) => setWalls(w => w.map(x => (x.id === id ? { ...x, [key]: val } : x)))}
          fields={[{ key: 'w', label: 'Ширина' }, { key: 'h', label: 'Высота' }]}
        />
        <CalcRowList
          title="Проёмы: окна/двери (ширина × высота)"
          unit="м"
          items={openings}
          onAdd={() => setOpenings(o => [...o, { id: nextId(), w: 1, h: 1 }])}
          onRemove={id => setOpenings(o => (o.length > 1 ? o.filter(x => x.id !== id) : o))}
          onChange={(id, key, val) => setOpenings(o => o.map(x => (x.id === id ? { ...x, [key]: val } : x)))}
          fields={[{ key: 'w', label: 'Ширина' }, { key: 'h', label: 'Высота' }]}
        />
        <CalcRowList
          title="Наружные углы (высота каждого)"
          unit="м"
          items={outerCorners}
          onAdd={() => setOuterCorners(c => [...c, { id: nextId(), h: 3 }])}
          onRemove={id => setOuterCorners(c => c.filter(x => x.id !== id))}
          onChange={(id, key, val) => setOuterCorners(c => c.map(x => (x.id === id ? { ...x, [key]: val } : x)))}
          fields={[{ key: 'h', label: 'Высота' }]}
        />
        <CalcRowList
          title="Внутренние углы (высота каждого)"
          unit="м"
          items={innerCorners}
          onAdd={() => setInnerCorners(c => [...c, { id: nextId(), h: 3 }])}
          onRemove={id => setInnerCorners(c => c.filter(x => x.id !== id))}
          onChange={(id, key, val) => setInnerCorners(c => c.map(x => (x.id === id ? { ...x, [key]: val } : x)))}
          fields={[{ key: 'h', label: 'Высота' }]}
        />
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
          Чистая площадь стен: <strong>{result.area.toFixed(1)} м²</strong>
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
          Углы и стартовая планка — расчётные позиции для ориентира. Точный подбор комплектующих под вашу коллекцию — у нашего специалиста.
        </p>
        {product && (
          <button onClick={handleAdd} className="calcw-primary-btn">
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} уп. панелей)`}
          </button>
        )}
      </div>
    </div>
  )
}
