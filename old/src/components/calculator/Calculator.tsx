'use client'
import { useState } from 'react'
import { getCalcType, calcResult, type CalcInputs, type CalcType } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { salePrice } from '@/lib/price'
import type { Product } from '@/types/catalog'

interface Props { catSlug: string; catName: string; product?: Product }

const TITLES: Record<CalcType, string> = {
  roofing:    '🏗️ Калькулятор кровли',
  gutter:     '🌧️ Калькулятор водостока',
  insulation: '🧱 Калькулятор утеплителя',
  screws:     '🔩 Калькулятор саморезов',
  siding:     '🏠 Калькулятор фасада / сайдинга',
}

export function Calculator({ catSlug, catName, product }: Props) {
  const { add } = useCart()
  const type = getCalcType(catSlug, catName, product?.title)
  const variant = product?.variants[0]

  const [inputs, setInputs] = useState<CalcInputs>({
    len: 10, wid: 6, slopes: 2, margin: 10,
    perim: 40, gutterLen: 3,
    areaInp: 60, layers: 1, packSize: variant?.pack_quantity ?? 1,
    perM2: 8,
    wallH: 3, openings: 15,
  })
  const [added, setAdded] = useState(false)

  const set = (patch: Partial<CalcInputs>) => setInputs(i => ({ ...i, ...patch }))
  const result = calcResult(type, inputs, variant?.sku_name ?? '', variant?.pack_quantity ?? 1)

  const handleAdd = () => {
    if (!product || !variant) return
    const fp = salePrice(variant.price)
    add({ sku: variant.sku, title: `${product.title} × ${result.qty} шт.`, price: fp, img: variant.images?.[0] ?? '', qty: result.qty })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const inp = (label: string, key: keyof CalcInputs, step = 1) => (
    <div className="calc-inp-wrap" key={key}>
      <label>{label}</label>
      <input className="calc-inp" type="number" value={inputs[key] ?? ''} step={step}
        onChange={e => set({ [key]: parseFloat(e.target.value) })} />
    </div>
  )

  return (
    <div className="calc-panel">
      <h3>{TITLES[type]}</h3>
      <div className="calc-grid">
        {type === 'roofing'    && <>{inp('Длина ската, м', 'len', 0.1)}{inp('Ширина ската, м', 'wid', 0.1)}{inp('Количество скатов', 'slopes')}{inp('Запас, %', 'margin')}</>}
        {type === 'gutter'     && <>{inp('Периметр кровли, м', 'perim', 0.5)}{inp('Длина элемента, м', 'gutterLen', 0.5)}{inp('Запас, %', 'margin')}</>}
        {type === 'insulation' && <>{inp('Площадь, м²', 'areaInp')}{inp('Слоёв утеплителя', 'layers')}{inp('Плит в упаковке', 'packSize')}{inp('Запас, %', 'margin')}</>}
        {type === 'screws'     && <>{inp('Площадь кровли / фасада, м²', 'areaInp')}{inp('Расход, шт/м²', 'perM2')}{inp('Штук в упаковке', 'packSize')}</>}
        {type === 'siding'     && <>{inp('Высота стены, м', 'wallH', 0.1)}{inp('Периметр здания, м', 'perim', 0.5)}{inp('Проёмы (окна+двери), м²', 'openings', 0.5)}{inp('Запас, %', 'margin')}</>}
      </div>
      <div className="calc-result">
        <div className="cres-text">
          {type === 'screws' ? Math.round(result.area) : result.area.toFixed(1)} {result.unit}
          &nbsp;·&nbsp; <strong>{result.qty} {result.qtyLabel}</strong>
        </div>
        {product && (
          <button className="calc-addbtn" onClick={handleAdd}>
            {added ? '✓ Добавлено!' : '+ Добавить в корзину'}
          </button>
        )}
      </div>
    </div>
  )
}
