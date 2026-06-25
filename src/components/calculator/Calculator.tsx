'use client'
import { useState } from 'react'
import { getCalcType, calcResult, type CalcInputs, type CalcType } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { SALE_RATE } from '@/lib/constants'
import type { Product } from '@/types/catalog'

interface Props { catSlug: string; catName: string; product?: Product }

const TITLES: Record<CalcType, string> = {
  roofing: '🏗️ Калькулятор кровли',
  gutter: '🌧️ Калькулятор водостока',
  insulation: '🧱 Калькулятор утеплителя',
  screws: '🔩 Калькулятор саморезов',
  siding: '🏠 Калькулятор фасада',
}

// Храним как строки чтобы можно было стереть поле и ввести любое число вручную
type RawInputs = Record<keyof CalcInputs, string>

function toCalcInputs(raw: RawInputs): CalcInputs {
  const parse = (v: string) => { const n = parseFloat(v.replace(',', '.')); return isNaN(n) ? 0 : n }
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, parse(v)])) as CalcInputs
}

export function Calculator({ catSlug, catName, product }: Props) {
  const { add } = useCart()
  const type = getCalcType(catSlug, catName, product?.title)
  const variant = product?.variants[0]
  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const [raw, setRaw] = useState<RawInputs>({
    len: '10', wid: '6', slopes: '2', margin: '10',
    perim: '40', gutterLen: '3',
    areaInp: '60', layers: '1', packSize: String(variant?.pack_quantity ?? 1),
    perM2: '8', wallH: '3', openings: '15',
  })

  const inputs = toCalcInputs(raw)
  const set = (key: keyof CalcInputs, val: string) => setRaw(r => ({ ...r, [key]: val }))
  const result = calcResult(type, inputs, variant?.sku_name ?? '', variant?.pack_quantity ?? 1)

  const handleAdd = () => {
    if (!product || !variant) return
    const fp = Math.round(variant.price * SALE_RATE)
    add({ sku: variant.sku, title: `${product.title} × ${result.qty} шт.`, price: fp, img: imgUrl(variant.images?.[0] ?? ''), qty: result.qty })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const inp = (label: string, key: keyof CalcInputs) => (
    <div key={key} className="flex flex-col gap-1">
      <label className="text-xs text-[var(--muted)]">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={raw[key]}
        onChange={e => set(key, e.target.value)}
        onFocus={e => e.target.select()}
        className="px-3 py-2 rounded-xl border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500"
      />
    </div>
  )

  return (
    <div className="mb-6 rounded-2xl border border-gray-800 bg-[var(--panel)] overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-white/5 transition-colors">
        <span>{TITLES[type]}</span>
        <span className="text-[var(--muted)]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {type === 'roofing'    && <>{inp('Длина ската, м', 'len', 0.1)}{inp('Ширина ската, м', 'wid', 0.1)}{inp('Кол-во скатов', 'slopes')}{inp('Запас, %', 'margin')}</>}
            {type === 'gutter'     && <>{inp('Периметр кровли, м', 'perim', 0.5)}{inp('Длина элемента, м', 'gutterLen', 0.5)}{inp('Запас, %', 'margin')}</>}
            {type === 'insulation' && <>{inp('Площадь, м²', 'areaInp')}{inp('Слоёв', 'layers')}{inp('Плит в упаковке', 'packSize')}{inp('Запас, %', 'margin')}</>}
            {type === 'screws'     && <>{inp('Площадь, м²', 'areaInp')}{inp('Расход, шт/м²', 'perM2')}{inp('Штук в упаковке', 'packSize')}</>}
            {type === 'siding'     && <>{inp('Высота стены, м', 'wallH', 0.1)}{inp('Периметр, м', 'perim', 0.5)}{inp('Проёмы, м²', 'openings', 0.5)}{inp('Запас, %', 'margin')}</>}
          </div>
          <div className="flex items-center justify-between bg-[var(--bg)] rounded-xl px-4 py-3">
            <div className="text-sm">
              {type === 'screws' ? Math.round(result.area) : result.area.toFixed(1)} {result.unit}
              <span className="mx-2 text-[var(--muted)]">·</span>
              <strong>{result.qty} {result.qtyLabel}</strong>
            </div>
            {product && (
              <button onClick={handleAdd}
                className="text-sm bg-[var(--dark)] text-white px-4 py-2 rounded-xl hover:opacity-80 transition-opacity">
                {added ? '✓ Добавлено!' : '+ В корзину'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
