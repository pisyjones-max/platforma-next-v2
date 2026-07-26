'use client'
import type { BrandFacet } from '@/lib/brandAliases'

interface Props {
  facets: BrandFacet[]
  selected: string[]
  onToggle: (name: string) => void
  onClear: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

function BrandList({ facets, selected, onToggle }: Pick<Props, 'facets' | 'selected' | 'onToggle'>) {
  return (
    <div className="brand-list">
      {facets.map(({ name, count }) => {
        const checked = selected.includes(name)
        return (
          <label key={name} className={`brand-item ${checked ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(name)}
            />
            <span className="brand-item-name">{name}</span>
            <span className="brand-item-count">{count}</span>
          </label>
        )
      })}
    </div>
  )
}

export function BrandFilter({ facets, selected, onToggle, onClear, mobileOpen, onMobileClose }: Props) {
  return (
    <>
      {/* Десктоп: постоянный сайдбар */}
      <aside className="brand-aside">
        <div className="brand-aside-title">
          <span>Бренд</span>
          {selected.length > 0 && (
            <span className="brand-aside-reset" onClick={onClear}>сбросить</span>
          )}
        </div>
        <BrandList facets={facets} selected={selected} onToggle={onToggle} />
      </aside>

      {/* Мобилка: сворачиваемая модалка снизу экрана */}
      <div className={`bmodal-overlay ${mobileOpen ? 'open' : ''}`} onClick={onMobileClose}>
        <div className="bmodal-sheet" onClick={e => e.stopPropagation()}>
          <div className="bmodal-hdr">
            <h3>Бренд</h3>
            <span className="bmodal-close" onClick={onMobileClose}>✕</span>
          </div>
          <div className="bmodal-body">
            <BrandList facets={facets} selected={selected} onToggle={onToggle} />
          </div>
          <div className="bmodal-footer">
            <button type="button" className="btn-sm" onClick={onClear} disabled={selected.length === 0}>
              Сбросить
            </button>
            <button type="button" className="btn-sm primary" style={{ flex: 1 }} onClick={onMobileClose}>
              Показать {selected.length > 0 ? `(${selected.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
