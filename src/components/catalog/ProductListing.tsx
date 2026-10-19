'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ProductCard } from './ProductCard'
import { CatalogFilters } from './CatalogFilters'
import { useFilters, colorKey, NO_MAX } from '@/hooks/useFilters'
import { getBrandFacets } from '@/lib/brandAliases'
import { salePrice } from '@/lib/price'
import type { Product } from '@/types/catalog'

export type ListedProduct = Product & { catSlug?: string }
export type PageResult = { products: ListedProduct[]; hasMore: boolean }

interface Props {
  /** первая порция товаров (приходит с сервера) */
  initialProducts: ListedProduct[]
  totalCount: number
  /** номер страницы, с которой открыта выдача, и всего страниц */
  page?: number
  totalPages?: number
  /** подгрузка страницы N (для «Загрузить ещё»); без неё кнопки нет */
  fetchPage?: (page: number) => Promise<PageResult>
  /** догрузка ВСЕХ оставшихся после страницы N разом (для фильтров); иначе — по страницам */
  fetchRest?: (afterPage: number) => Promise<ListedProduct[]>
  /** SEO-ссылка «Загрузить ещё» (настоящий URL страницы N) */
  loadMoreHref?: (page: number) => string
  getHref: (p: ListedProduct) => string
  emptyName?: string
}

export function ProductListing({
  initialProducts, totalCount, page = 1, totalPages = 1,
  fetchPage, fetchRest, loadMoreHref, getHref, emptyName,
}: Props) {
  const [products, setProducts] = useState<ListedProduct[]>(initialProducts)
  const [loadedPage, setLoadedPage] = useState(page)
  const [hasMore, setHasMore] = useState(page < totalPages)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadMore = async () => {
    if (loadingMore || !hasMore || !fetchPage) return
    setLoadingMore(true)
    try {
      const nextPage = loadedPage + 1
      const data = await fetchPage(nextPage)
      setProducts(prev => [...prev, ...data.products])
      setLoadedPage(nextPage)
      setHasMore(data.hasMore)
    } catch (e) {
      console.error('[ProductListing] Не удалось подгрузить товары:', e)
    } finally {
      setLoadingMore(false)
    }
  }

  const { filters, setFilters, search, setSearch, filtered, reset } = useFilters(products)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo] = useState('')

  const onPrice = (from: string, to: string) => {
    setPriceFrom(from); setPriceTo(to)
    setFilters(f => ({ ...f, minPrice: from ? Number(from) : 0, maxPrice: to ? Number(to) : NO_MAX }))
  }
  const resetAll = () => { reset(); setPriceFrom(''); setPriceTo('') }

  const priceBounds = useMemo(() => {
    const prices = products.map(p => salePrice(p.variants[0].price)).filter(n => n > 0)
    return prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 }
  }, [products])

  const brandFacets = useMemo(() => getBrandFacets(products), [products])

  const colorFacets = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products) {
      for (const c of new Set(p.variants.map(colorKey).filter(Boolean))) counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    return Array.from(counts, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ru'))
  }, [products])

  const toggleBrand = (name: string) => {
    setFilters(f => ({
      ...f,
      brand: f.brand.includes(name) ? f.brand.filter(b => b !== name) : [...f.brand, name],
    }))
  }
  const toggleColor = (name: string) => {
    setFilters(f => ({
      ...f,
      colors: f.colors.includes(name) ? f.colors.filter(c => c !== name) : [...f.colors, name],
    }))
  }

  const hasActiveFilters =
    filters.brand.length > 0 || filters.colors.length > 0 || search.length > 0 ||
    filters.minPrice > 0 || filters.maxPrice < NO_MAX || filters.sort !== 'default'

  // Фильтры и сортировка должны работать по ВСЕМУ списку, а не только по уже
  // подгруженной порции — как только фильтр включён, дозагружаем остальное.
  const loadingAll = useRef(false)
  const [loadingAllUi, setLoadingAllUi] = useState(false)
  useEffect(() => {
    if (!hasActiveFilters || !hasMore || loadingAll.current || (!fetchRest && !fetchPage)) return
    loadingAll.current = true
    setLoadingAllUi(true)
    ;(async () => {
      try {
        let acc: ListedProduct[] = []
        if (fetchRest) {
          acc = await fetchRest(loadedPage)
        } else if (fetchPage) {
          let next = loadedPage + 1
          let more = true
          while (more) {
            const data = await fetchPage(next)
            acc.push(...data.products)
            more = data.hasMore
            next++
          }
        }
        setProducts(prev => [...prev, ...acc])
        setHasMore(false)
      } catch (e) {
        console.error('[ProductListing] Не удалось догрузить товары для фильтров:', e)
      } finally {
        loadingAll.current = false
        setLoadingAllUi(false)
      }
    })()
  }, [hasActiveFilters, hasMore, loadedPage, fetchRest, fetchPage])

  return (
    <>
      <div className="fbar">
        <input
          className="fbar-search"
          placeholder="🔍 Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {hasActiveFilters && (
          <button type="button" className="btn-sm" onClick={resetAll}>Сбросить фильтры</button>
        )}
        <button type="button" className="btn-sm brand-mobile-btn" onClick={() => setMobileOpen(true)}>
          ⚙ Фильтры{hasActiveFilters ? ' •' : ''}
        </button>
        <select
          className="cf-sort" aria-label="Сортировка"
          value={filters.sort}
          onChange={e => setFilters(f => ({ ...f, sort: e.target.value as typeof f.sort }))}
        >
          <option value="default">По умолчанию</option>
          <option value="price_asc">Сначала дешёвые</option>
          <option value="price_desc">Сначала дорогие</option>
          <option value="name">По названию</option>
        </select>
        <span className="rcnt">{loadingAllUi ? 'Загружаем…' : `${filtered.length} товаров`}</span>
      </div>

      <div className="cat-layout">
        {initialProducts.length > 0 && (
          <CatalogFilters
            brands={brandFacets}
            selectedBrands={filters.brand}
            onToggleBrand={toggleBrand}
            colors={colorFacets}
            selectedColors={filters.colors}
            onToggleColor={toggleColor}
            priceBounds={priceBounds}
            priceFrom={priceFrom}
            priceTo={priceTo}
            onPrice={onPrice}
            onReset={resetAll}
            hasActive={hasActiveFilters}
            foundCount={filtered.length}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />
        )}
        <div className="cat-main">
          {initialProducts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '56px 24px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 16,
            }}>
              <div style={{ fontSize: 34, marginBottom: 12 }}>📦</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
                Товар временно отсутствует
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 14.5, maxWidth: 420, margin: '0 auto 20px' }}>
                Мы регулярно обновляем ассортимент «{(emptyName ?? '').toLowerCase()}». Напишите нам — уточним сроки
                поступления или подберём аналог из наличия.
              </p>
              <a
                href="https://t.me/platforma_roof" target="_blank" rel="noopener noreferrer"
                className="btn-sm primary"
                style={{ display: 'inline-block', padding: '11px 22px', textDecoration: 'none' }}
              >
                💬 Написать в Telegram
              </a>
            </div>
          ) : (
            <div className="pgrid">
              {filtered.map(p => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  price={p.variants?.[0]?.price ?? 0}
                  img={p.variants?.[0]?.images?.[0]}
                  sku={p.variants?.[0]?.sku}
                  href={getHref(p)}
                  description={p.description}
                  features={p.features}
                />
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                  Ничего не найдено
                </div>
              )}
            </div>
          )}
          {/* «Загрузить ещё» — прогрессивное улучшение поверх обычной постраничной
              ссылки: краулер без JS идёт по настоящему URL страницы N, а у
              пользователя клик перехватывается и товары подгружаются на месте. */}
          {totalPages > 1 && fetchPage && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 28 }}>
              {hasMore ? (
                <Link
                  href={loadMoreHref ? loadMoreHref(loadedPage + 1) : '#'}
                  className="btn-sm primary"
                  style={{ padding: '11px 28px', height: 'auto', opacity: loadingMore ? 0.6 : 1, pointerEvents: loadingMore ? 'none' : undefined }}
                  onClick={e => { e.preventDefault(); loadMore() }}
                  aria-busy={loadingMore}
                >
                  {loadingMore ? 'Загружаем…' : 'Загрузить ещё'}
                </Link>
              ) : (
                <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>
                  Показаны все {totalCount} товаров
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
