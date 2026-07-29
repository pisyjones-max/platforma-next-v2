'use client'
import { useState, useMemo } from 'react'
import { calcGutterDetailed, type GutterRunItem } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { SALE_RATE } from '@/lib/constants'
import type { Product } from '@/types/catalog'
import {
  CalcRowList, nextCalcId,
  CALC_LABEL_CLS, CALC_INPUT_CLS, CALC_RESULT_PANEL_CLS, CALC_PRIMARY_BTN_CLS, CALC_HEADFONT,
} from './CalcRowList'

const nextId = () => nextCalcId('run')

interface Props { product?: Product }

function NumBox({ label, value, onChange, unit = 'м' }: { label: string; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={CALC_LABEL_CLS}>{label}, {unit}</label>
      <input
        type="number"
        step="1"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className={CALC_INPUT_CLS}
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
      <CalcRowList
        title="Участки жёлоба (длина)"
        unit="м"
        items={runs}
        onAdd={() => setRuns(r => [...r, { id: nextId(), len: 10 }])}
        onRemove={id => setRuns(r => (r.length > 1 ? r.filter(x => x.id !== id) : r))}
        onChange={(id, key, val) => setRuns(r => r.map(x => (x.id === id ? { ...x, [key]: val } : x)))}
        fields={[{ key: 'len', label: 'Длина' }]}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
        <NumBox label="Углы наружные" value={outerCorners} onChange={setOuterCorners} unit="шт" />
        <NumBox label="Углы внутренние" value={innerCorners} onChange={setInnerCorners} unit="шт" />
        <NumBox label="Воронки" value={funnels} onChange={setFunnels} unit="шт" />
        <NumBox label="Высота стены" value={wallHeight} onChange={setWallHeight} />
        <NumBox label="Колен на воронку" value={elbowsPerFunnel} onChange={setElbowsPerFunnel} unit="шт" />
        <NumBox label="Запас" value={margin} onChange={setMargin} unit="%" />
      </div>

      <div className={CALC_RESULT_PANEL_CLS}>
        <div className="text-[13px] text-[var(--muted)]">
          Длина жёлоба:{' '}
          <strong style={CALC_HEADFONT} className="text-[15px] text-[var(--dark)]">
            {result.area.toFixed(1)} м
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
          Углы, воронки, трубы и колена — расчётные позиции для ориентира. Точную схему водоотведения под ваш дом подберёт наш специалист.
        </p>
        {product && (
          <button onClick={handleAdd} className={CALC_PRIMARY_BTN_CLS}>
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} шт. жёлоба)`}
          </button>
        )}
      </div>
    </div>
  )
}
