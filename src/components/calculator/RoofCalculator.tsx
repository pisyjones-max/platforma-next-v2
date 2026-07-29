'use client'
import { useState, useMemo } from 'react'
import { calcRoofDetailed, type RoofSlopeItem } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { SALE_RATE } from '@/lib/constants'
import type { Product } from '@/types/catalog'
import {
  CalcRowList, nextCalcId,
  CALC_LABEL_CLS, CALC_INPUT_CLS, CALC_RESULT_PANEL_CLS, CALC_PRIMARY_BTN_CLS, CALC_HEADFONT,
} from './CalcRowList'

const nextId = () => nextCalcId('slope')

interface Props { product?: Product }

function NumBox({ label, value, onChange, unit = 'м' }: { label: string; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={CALC_LABEL_CLS}>{label}, {unit}</label>
      <input
        type="number"
        step="0.5"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className={CALC_INPUT_CLS}
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
    <div className="flex flex-col gap-5">
      <CalcRowList
        title="Скаты (длина × ширина)"
        unit="м"
        items={slopes}
        onAdd={() => setSlopes(s => [...s, { id: nextId(), len: 5, wid: 5 }])}
        onRemove={id => setSlopes(s => (s.length > 1 ? s.filter(x => x.id !== id) : s))}
        onChange={(id, key, val) => setSlopes(s => s.map(x => (x.id === id ? { ...x, [key]: val } : x)))}
        fields={[{ key: 'len', label: 'Длина' }, { key: 'wid', label: 'Ширина' }]}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
        <NumBox label="Длина конька" value={ridgeLen} onChange={setRidgeLen} />
        <NumBox label="Карнизные свесы" value={eaveLen} onChange={setEaveLen} />
        <NumBox label="Фронтонные свесы" value={vergeLen} onChange={setVergeLen} />
        <NumBox label="Ендова" value={valleyLen} onChange={setValleyLen} />
      </div>

      <div className="flex flex-col gap-1.5 max-w-[140px]">
        <label className={CALC_LABEL_CLS}>Запас, %</label>
        <input
          type="number"
          value={margin}
          onChange={e => setMargin(parseFloat(e.target.value) || 0)}
          className={CALC_INPUT_CLS}
        />
      </div>

      <div className={CALC_RESULT_PANEL_CLS}>
        <div className="text-[13px] text-[var(--muted)]">
          Площадь кровли:{' '}
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
          Конёк, свесы и ендова — расчётные позиции для ориентира. Точный подбор доборных элементов под вашу кровлю — у нашего специалиста.
        </p>
        {product && (
          <button onClick={handleAdd} className={CALC_PRIMARY_BTN_CLS}>
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} шт. материала)`}
          </button>
        )}
      </div>
    </div>
  )
}
