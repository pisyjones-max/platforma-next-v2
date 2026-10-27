'use client'
import { useState, useMemo } from 'react'
import { calcFence, parseFenceWidthMm, FENCE_DEFAULT_WIDTH_MM, type FenceKind } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { salePrice } from '@/lib/price'
import type { Product } from '@/types/catalog'
import { CalcBom } from './CalcBom'

interface Props { product?: Product; catSlug?: string }

function NumBox({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div className="calcw-field">
      <label>{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="calcw-input"
      />
    </div>
  )
}

export function FenceCalculator({ product, catSlug = '' }: Props) {
  const { add } = useCart()
  const variant = product?.variants[0]
  // профнастил — сплошные листы, остальное (евроштакетник, заборная доска) — штакетины с зазором
  const kind: FenceKind = catSlug === 'profnastil-dlya-zabora' ? 'sheet' : 'picket'
  const [added, setAdded] = useState(false)
  const [length, setLength] = useState(30)
  const [height, setHeight] = useState(1.8)
  const [gatesWidth, setGatesWidth] = useState(4)
  const [gatesCount, setGatesCount] = useState(2)
  const [elementWidthMm, setElementWidthMm] = useState(
    parseFenceWidthMm(product?.features, product?.title, kind) || FENCE_DEFAULT_WIDTH_MM[kind]
  )
  const [gapMm, setGapMm] = useState(kind === 'picket' ? 30 : 0)
  const [postStep, setPostStep] = useState(2.5)
  const [margin, setMargin] = useState(5)

  const result = useMemo(
    () => calcFence({ kind, length, height, gatesWidth, gatesCount, elementWidthMm, gapMm, postStep, margin }, catSlug),
    [kind, length, height, gatesWidth, gatesCount, elementWidthMm, gapMm, postStep, margin, catSlug]
  )

  const handleAdd = () => {
    if (!product || !variant || result.qty < 1) return
    add({
      sku: variant.sku,
      title: `${product.title} × ${result.qty} шт.`,
      price: salePrice(variant.price),
      img: imgUrl(variant.images?.[0] ?? ''),
      qty: result.qty,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="calcw-stack">
      <div className="calcw-grid">
        <NumBox label="Длина забора, м" value={length} onChange={setLength} />
        <NumBox label="Высота, м" value={height} onChange={setHeight} step={0.1} />
        <NumBox label="Ворота и калитка (ширина), м" value={gatesWidth} onChange={setGatesWidth} step={0.5} />
        <NumBox label="Проёмов (ворота + калитка), шт." value={gatesCount} onChange={setGatesCount} />
        <NumBox label={kind === 'sheet' ? 'Полезная ширина листа, мм' : 'Ширина штакетины, мм'} value={elementWidthMm} onChange={setElementWidthMm} />
        {kind === 'picket' && <NumBox label="Зазор между штакетинами, мм" value={gapMm} onChange={setGapMm} />}
        <NumBox label="Шаг столбов, м" value={postStep} onChange={setPostStep} step={0.5} />
        <NumBox label="Запас, %" value={margin} onChange={setMargin} />
      </div>

      <div className="calcw-result">
        <div className="calcw-result-area">
          Длина забора без проёмов: <strong>{result.netLen.toFixed(1)} м</strong>
          {' · '}площадь: <strong>{result.area.toFixed(1)} м²</strong>
        </div>
        <CalcBom bom={result.bom} />
        <p className="calcw-note">
          Ширину из характеристик товара подставили сами — на упаковке или в спецификации проверьте точную. Лаги, столбы и крепёж — ориентировочно, под ваш участок и грунт лучше уточнить у специалиста.
        </p>
        {product && (
          <button onClick={handleAdd} className="calcw-primary-btn">
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} шт.)`}
          </button>
        )}
      </div>
    </div>
  )
}
