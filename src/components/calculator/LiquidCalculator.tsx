'use client'
import { useState, useMemo } from 'react'
import { calcLiquidDetailed, parseLiquidPack, LIQUID_DEFAULT_PER_M2 } from '@/lib/calculator'
import { useCart } from '@/context/CartContext'
import { imgUrl } from '@/lib/image'
import { salePrice } from '@/lib/price'
import type { Product } from '@/types/catalog'
import { NumInput } from './NumInput'

interface Props { product?: Product; catSlug?: string }

const num = (v?: string) => {
  const m = (v ?? '').match(/\d+(?:[.,]\d+)?/)
  return m ? parseFloat(m[0].replace(',', '.')) : 0
}

export function LiquidCalculator({ product, catSlug = '' }: Props) {
  const { add } = useCart()
  const variant = product?.variants[0]
  const pack = parseLiquidPack(product?.features, product?.title, variant?.sku_name)

  // Если в характеристиках есть «Площадь полезная» — расход на слой считаем из неё
  const usefulArea = num(product?.features?.['Площадь полезная'])
  const derivedPerM2 = usefulArea > 0 ? pack.volume / usefulArea : 0
  const initialPerM2 = derivedPerM2 > 0
    ? Math.round(derivedPerM2 * 1000) / 1000
    : (LIQUID_DEFAULT_PER_M2[catSlug] ?? 0.2)

  const [added, setAdded] = useState(false)
  const [area, setArea] = useState(0)
  const [coats, setCoats] = useState(2)
  const [perM2, setPerM2] = useState(initialPerM2)
  const [packVolume, setPackVolume] = useState(pack.volume)
  const [margin, setMargin] = useState(10)

  const result = useMemo(
    () => calcLiquidDetailed({ area, coats, perM2, packVolume, margin }),
    [area, coats, perM2, packVolume, margin]
  )

  const handleAdd = () => {
    if (!product || !variant || result.qty < 1) return
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
      <div className="calcw-grid">
        <div className="calcw-field">
          <label>Площадь, м²</label>
          <NumInput
             value={area}
            onChange={v => setArea(v || 0)}
            className="calcw-input"
          />
        </div>
        <div className="calcw-field">
          <label>Слоёв</label>
          <NumInput
             min={1} value={coats}
            onChange={v => setCoats(v || 1)}
            className="calcw-input"
          />
        </div>
        <div className="calcw-field">
          <label>Расход, {pack.unit}/м² на слой</label>
          <NumInput
             step="0.01" value={perM2}
            onChange={v => setPerM2(v || 0)}
            className="calcw-input"
          />
        </div>
        <div className="calcw-field">
          <label>В таре, {pack.unit}</label>
          <NumInput
             step="0.1" value={packVolume}
            onChange={v => setPackVolume(v || 0)}
            className="calcw-input"
          />
        </div>
        <div className="calcw-field">
          <label>Запас, %</label>
          <NumInput
             value={margin}
            onChange={v => setMargin(v || 0)}
            className="calcw-input"
          />
        </div>
      </div>

      {result.qty < 1 ? (
        <p className="calcw-note">Введите размеры — расчёт появится здесь.</p>
      ) : (
      <div className="calcw-result">
        <div className="calcw-result-area">
          Нужно состава: <strong>{result.total.toFixed(1)} {pack.unit}</strong>
        </div>
        <div className="calcw-bom">
          <div className="calcw-bom-row">
            <span>{product?.title ?? 'Состав'}</span>
            <strong>{result.qty} шт.</strong>
          </div>
        </div>
        <p className="calcw-note">
          Расход ориентировочный: зависит от основания и способа нанесения. Точную цифру смотрите на упаковке и при необходимости поправьте вручную.
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
