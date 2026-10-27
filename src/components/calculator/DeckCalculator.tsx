'use client'
import { useState, useMemo } from 'react'
import { calcDeck, parseDeckBoard } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { salePrice } from '@/lib/price'
import type { Product } from '@/types/catalog'
import { CalcBom } from './CalcBom'
import { NumInput } from './NumInput'

interface Props { product?: Product }

function NumBox({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div className="calcw-field">
      <label>{label}</label>
      <NumInput
        
        step={step}
        value={value}
        onChange={v => onChange(v || 0)}
        className="calcw-input"
      />
    </div>
  )
}

export function DeckCalculator({ product }: Props) {
  const { add } = useCart()
  const variant = product?.variants[0]
  const board = parseDeckBoard(product?.features, product?.title, variant?.sku_name)
  const [added, setAdded] = useState(false)
  const [area, setArea] = useState(0)
  const [boardLenM, setBoardLenM] = useState(board.lenM)
  const [boardWidMm, setBoardWidMm] = useState(board.widMm)
  const [gapMm, setGapMm] = useState(6)
  const [joistStep, setJoistStep] = useState(0.4)
  const [diagonal, setDiagonal] = useState(false)
  const [margin, setMargin] = useState(10)

  const result = useMemo(
    () => calcDeck({ area, boardLenM, boardWidMm, gapMm, joistStep, diagonal, margin }),
    [area, boardLenM, boardWidMm, gapMm, joistStep, diagonal, margin]
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
        <NumBox label="Площадь террасы, м²" value={area} onChange={setArea} />
        <NumBox label="Длина доски, м" value={boardLenM} onChange={setBoardLenM} step={0.5} />
        <NumBox label="Ширина доски, мм" value={boardWidMm} onChange={setBoardWidMm} />
        <NumBox label="Зазор между досками, мм" value={gapMm} onChange={setGapMm} />
        <NumBox label="Шаг лаг, м" value={joistStep} onChange={setJoistStep} step={0.05} />
        <NumBox label="Запас, %" value={margin} onChange={setMargin} />
      </div>
      <label className="calcw-row" style={{ gap: 8, fontSize: 14, cursor: 'pointer' }}>
        <input type="checkbox" checked={diagonal} onChange={e => setDiagonal(e.target.checked)} />
        Диагональная раскладка (+5% на подрезку)
      </label>

      {result.qty < 1 ? (
        <p className="calcw-note">Введите размеры — расчёт появится здесь.</p>
      ) : (
      <div className="calcw-result">
        <div className="calcw-result-area">
          Площадь с запасом: <strong>{result.area.toFixed(1)} м²</strong>
        </div>
        <CalcBom bom={result.bom} />
        <p className="calcw-note">
          Размер доски подставлен из характеристик товара — если нужен другой, поправьте вручную. Лаги и кляймеры — расчётные позиции для ориентира, подбор под вашу террасу лучше уточнить у специалиста.
        </p>
        {product && (
          <button onClick={handleAdd} className="calcw-primary-btn">
            {added ? '✓ Добавлено!' : `+ В корзину (${result.qty} шт.)`}
          </button>
        )}
      </div>
      )}
    </div>
  )
}
