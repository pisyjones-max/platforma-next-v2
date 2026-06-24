'use client'
import type { Filters } from '@/types/cart'

interface Props {
  filters: Filters
  setFilters: (f: Filters) => void
  search: string
  setSearch: (s: string) => void
  colors: string[]
  brands: string[]
  maxPrice: number
  onReset: () => void
}

export function FilterBar({ filters, setFilters, search, setSearch, colors, brands, onReset }: Props) {
  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch })

  return (
    <div className="filter-bar">
      <input className="srch-inp" placeholder="Поиск..." value={search}
        onChange={e => setSearch(e.target.value)} />
      <select value={filters.sort} onChange={e => set({ sort: e.target.value as Filters['sort'] })}>
        <option value="default">По умолчанию</option>
        <option value="price_asc">Цена ↑</option>
        <option value="price_desc">Цена ↓</option>
        <option value="name">По названию</option>
      </select>
      {colors.length > 0 && (
        <select value={filters.color} onChange={e => set({ color: e.target.value })}>
          <option value="">Все цвета</option>
          {colors.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      {brands.length > 0 && (
        <select value={filters.brand} onChange={e => set({ brand: e.target.value })}>
          <option value="">Все бренды</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      )}
      <button onClick={onReset}>Сбросить</button>
    </div>
  )
}
