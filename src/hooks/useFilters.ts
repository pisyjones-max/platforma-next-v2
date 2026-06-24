'use client'
import { useState, useMemo } from 'react'
import type { Product } from '@/types/catalog'
import type { Filters } from '@/types/cart'
import { salePrice } from '@/lib/price'

const DEFAULT_FILTERS: Filters = {
  minPrice: 0, maxPrice: 999999, color: '', brand: '', sort: 'default',
}

export function useFilters(products: Product[]) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = [...products]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      )
    }
    list = list.filter(p => {
      const fp = salePrice(p.variants[0].price)
      return fp >= filters.minPrice && (filters.maxPrice >= 99999 || fp <= filters.maxPrice)
    })
    if (filters.color) {
      const q = filters.color.toLowerCase()
      list = list.filter(p => p.variants.some(v => (v.color ?? v.sku_name ?? '').toLowerCase().includes(q)))
    }
    if (filters.brand) {
      const q = filters.brand.toLowerCase()
      list = list.filter(p =>
        (p.features?.['Производитель'] ?? '').toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q)
      )
    }
    if (filters.sort === 'price_asc')  list.sort((a, b) => a.variants[0].price - b.variants[0].price)
    if (filters.sort === 'price_desc') list.sort((a, b) => b.variants[0].price - a.variants[0].price)
    if (filters.sort === 'name')       list.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
    return list
  }, [products, filters, search])

  const reset = () => { setFilters(DEFAULT_FILTERS); setSearch('') }

  return { filters, setFilters, search, setSearch, filtered, reset }
}
