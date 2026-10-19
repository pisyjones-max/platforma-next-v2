'use client'
import { useState } from 'react'
import type { BrandFacet } from '@/lib/brandAliases'

export interface ColorFacet { name: string; count: number }

interface Props {
  brands: BrandFacet[]
  selectedBrands: string[]
  onToggleBrand: (name: string) => void
  colors: ColorFacet[]
  selectedColors: string[]
  onToggleColor: (name: string) => void
  /** границы цен по категории — подсказки в полях «от/до» */
  priceBounds: { min: number; max: number }
  priceFrom: string
  priceTo: string
  onPrice: (from: string, to: string) => void
  onReset: () => void
  hasActive: boolean
  foundCount: number
  mobileOpen: boolean
  onMobileClose: () => void
}

const COLLAPSED = 8

function CheckList({ items, selected, onToggle }: {
  items: { name: string; count: number }[]
  selected: string[]
  onToggle: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const visible = open || items.length <= COLLAPSED
    ? items
    : items.filter((i, idx) => idx < COLLAPSED || selected.includes(i.name))
  const hidden = items.length - visible.length
  return (
    <>
      <div className="brand-list">
        {visible.map(({ name, count }) => {
          const checked = selected.includes(name)
          return (
            <label key={name} className={`brand-item ${checked ? 'checked' : ''}`}>
              <input type="checkbox" checked={checked} onChange={() => onToggle(name)} />
              <span className="brand-item-name">{name}</span>
              <span className="brand-item-count">{count}</span>
            </label>
          )
        })}
      </div>
      {hidden > 0 && <button type="button" className="cf-more" onClick={() => setOpen(true)}>Показать все ({items.length})</button>}
      {open && items.length > COLLAPSED && <button type="button" className="cf-more" onClick={() => setOpen(false)}>Свернуть</button>}
    </>
  )
}

function Panel(p: Props) {
  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 7)
  return (
    <>
      <div className="cf-sec">
        <div className="cf-title">Цена, ₽</div>
        <div className="cf-price">
          <input
            inputMode="numeric" aria-label="Цена от"
            placeholder={`от ${p.priceBounds.min.toLocaleString('ru-RU')}`}
            value={p.priceFrom}
            onChange={e => p.onPrice(digits(e.target.value), p.priceTo)}
          />
          <span>–</span>
          <input
            inputMode="numeric" aria-label="Цена до"
            placeholder={`до ${p.priceBounds.max.toLocaleString('ru-RU')}`}
            value={p.priceTo}
            onChange={e => p.onPrice(p.priceFrom, digits(e.target.value))}
          />
        </div>
      </div>

      {p.brands.length > 1 && (
        <div className="cf-sec">
          <div className="cf-title">Бренд</div>
          <CheckList items={p.brands} selected={p.selectedBrands} onToggle={p.onToggleBrand} />
        </div>
      )}

      {p.colors.length > 1 && (
        <div className="cf-sec">
          <div className="cf-title">Цвет</div>
          <CheckList items={p.colors} selected={p.selectedColors} onToggle={p.onToggleColor} />
        </div>
      )}
    </>
  )
}

export function CatalogFilters(props: Props) {
  const { hasActive, onReset, foundCount, mobileOpen, onMobileClose } = props
  return (
    <>
      {/* Десктоп: постоянный сайдбар как на Ozon */}
      <aside className="brand-aside cf-aside">
        <div className="brand-aside-title">
          <span>Фильтры</span>
          {hasActive && <span className="brand-aside-reset" onClick={onReset}>сбросить всё</span>}
        </div>
        <Panel {...props} />
      </aside>

      {/* Мобилка: шторка снизу */}
      <div className={`bmodal-overlay ${mobileOpen ? 'open' : ''}`} onClick={onMobileClose}>
        <div className="bmodal-sheet" onClick={e => e.stopPropagation()}>
          <div className="bmodal-hdr">
            <h3>Фильтры</h3>
            <span className="bmodal-close" onClick={onMobileClose}>✕</span>
          </div>
          <div className="bmodal-body"><Panel {...props} /></div>
          <div className="bmodal-footer">
            <button type="button" className="btn-sm" onClick={onReset} disabled={!hasActive}>Сбросить</button>
            <button type="button" className="btn-sm primary" style={{ flex: 1 }} onClick={onMobileClose}>
              Показать {foundCount} {foundCount === 1 ? 'товар' : 'товаров'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
