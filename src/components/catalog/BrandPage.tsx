'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ProductCard } from './ProductCard'
import { productSlug } from '@/lib/slug'
import { DISC_LABEL } from '@/lib/constants'
import type { Product, Category } from '@/types/catalog'
import type { BrandSeo } from '@/lib/brands'

interface CategoryFacet {
  slug: string
  name: string
  count: number
}

interface Props {
  brandName: string
  seo: BrandSeo
  items: { product: Product; category: Category }[]
  categoryFacets: CategoryFacet[]
}

export function BrandPage({ brandName, seo, items, categoryFacets }: Props) {
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'default' | 'price_asc' | 'price_desc' | 'name'>('default')
  const [catModalOpen, setCatModalOpen] = useState(false)

  const toggleCat = (slug: string) => {
    setSelectedCats(s => (s.includes(slug) ? s.filter(x => x !== slug) : [...s, slug]))
  }
  const clearCats = () => setSelectedCats([])

  const filtered = useMemo(() => {
    let list = items
    if (selectedCats.length > 0) {
      const set = new Set(selectedCats)
      list = list.filter(({ category }) => set.has(category.slug))
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        ({ product: p }) => p.title.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
      )
    }
    const sorted = [...list]
    if (sort === 'price_asc') sorted.sort((a, b) => a.product.variants[0].price - b.product.variants[0].price)
    if (sort === 'price_desc') sorted.sort((a, b) => b.product.variants[0].price - a.product.variants[0].price)
    if (sort === 'name') sorted.sort((a, b) => a.product.title.localeCompare(b.product.title, 'ru'))
    return sorted
  }, [items, selectedCats, search, sort])

  const hasActiveFilters = selectedCats.length > 0 || search.length > 0

  return (
    <div id="main">
      <nav className="breadcrumb">
        <span className="bc-item bc-link"><Link href="/">Каталог</Link></span>
        <span className="bc-sep">›</span>
        <span className="bc-item bc-link"><Link href="/catalog/brand">Бренды</Link></span>
        <span className="bc-sep">›</span>
        <span className="bc-item bc-cur">{brandName}</span>
      </nav>

      <div className="hero">
        <div>
          <h1>{seo.title.replace(' — купить в Московской области', '')}</h1>
          <p>{seo.intro}</p>
        </div>
        <div className="hero-right">
          <div className="hero-stat"><span>{items.length}</span><small>товаров</small></div>
          <div className="hero-badge"><div className="hero-badge-val">{DISC_LABEL}</div><div className="hero-badge-lbl">скидка</div></div>
        </div>
      </div>

      <div className="fbar">
        <input
          style={{ padding: '0 14px', width: 220, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, height: 32, borderRadius: 20, outline: 'none' }}
          placeholder="🔍 Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {categoryFacets.length > 1 && (
          <button
            type="button"
            className={`fchip brand-mobile-btn ${selectedCats.length > 0 ? 'active' : ''}`}
            onClick={() => setCatModalOpen(true)}
          >
            Категория{selectedCats.length > 0 ? ` (${selectedCats.length})` : ''}
          </button>
        )}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as typeof sort)}
          style={{ height: 32, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, padding: '0 10px' }}
        >
          <option value="default">По умолчанию</option>
          <option value="price_asc">Сначала дешевле</option>
          <option value="price_desc">Сначала дороже</option>
          <option value="name">По названию</option>
        </select>
        {hasActiveFilters && (
          <button type="button" className="btn-sm" onClick={() => { clearCats(); setSearch('') }}>Сбросить фильтры</button>
        )}
        <span className="rcnt">{filtered.length} товаров</span>
      </div>

      <div className="cat-layout">
        {categoryFacets.length > 1 && (
          <>
            <aside className="brand-aside">
              <div className="brand-aside-title">
                <span>Категория</span>
                {selectedCats.length > 0 && <span className="brand-aside-reset" onClick={clearCats}>сбросить</span>}
              </div>
              <div className="brand-list">
                {categoryFacets.map(({ slug, name, count }) => {
                  const checked = selectedCats.includes(slug)
                  return (
                    <label key={slug} className={`brand-item ${checked ? 'checked' : ''}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleCat(slug)} />
                      <span className="brand-item-name">{name}</span>
                      <span className="brand-item-count">{count}</span>
                    </label>
                  )
                })}
              </div>
            </aside>

            <div className={`bmodal-overlay ${catModalOpen ? 'open' : ''}`} onClick={() => setCatModalOpen(false)}>
              <div className="bmodal-sheet" onClick={e => e.stopPropagation()}>
                <div className="bmodal-hdr">
                  <h3>Категория</h3>
                  <span className="bmodal-close" onClick={() => setCatModalOpen(false)}>✕</span>
                </div>
                <div className="bmodal-body">
                  <div className="brand-list">
                    {categoryFacets.map(({ slug, name, count }) => {
                      const checked = selectedCats.includes(slug)
                      return (
                        <label key={slug} className={`brand-item ${checked ? 'checked' : ''}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleCat(slug)} />
                          <span className="brand-item-name">{name}</span>
                          <span className="brand-item-count">{count}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
                <div className="bmodal-footer">
                  <button type="button" className="btn-sm" onClick={clearCats} disabled={selectedCats.length === 0}>Сбросить</button>
                  <button type="button" className="btn-sm primary" style={{ flex: 1 }} onClick={() => setCatModalOpen(false)}>
                    Показать {selectedCats.length > 0 ? `(${selectedCats.length})` : ''}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="cat-main">
          <div className="pgrid">
            {filtered.map(({ product: p, category }) => {
              const pid = productSlug(p.id)
              return (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  price={p.variants?.[0]?.price ?? 0}
                  img={p.variants?.[0]?.images?.[0]}
                  sku={p.variants?.[0]?.sku}
                  href={`/catalog/${category.slug}/${pid}`}
                  description={p.description}
                  features={p.features}
                />
              )
            })}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                Ничего не найдено
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
