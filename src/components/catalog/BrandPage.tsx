'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ProductCard } from './ProductCard'
import { productSlug } from '@/lib/slug'
import { PHONE_NUMBER } from '@/lib/constants'
import type { Product, Category } from '@/types/catalog'
import type { BrandSeo, BrandStats, BrandFaqItem } from '@/lib/brands'

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
  stats?: BrandStats
  faq?: BrandFaqItem[]
  logoUrl?: string
}

export function BrandPage({ brandName, seo, items, categoryFacets, stats, faq = [], logoUrl }: Props) {
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'default' | 'price_asc' | 'price_desc' | 'name'>('default')
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={brandName} style={{ maxHeight: 48, maxWidth: 180, objectFit: 'contain', marginBottom: 12 }} />
          )}
          <h1>{seo.title.replace(' — купить в Московской области', '')}</h1>
          <p>{seo.intro}</p>
        </div>
        <div className="hero-right">
          <div className="hero-stat"><span>{items.length}</span><small>товаров</small></div>
        </div>
      </div>

      {/* О бренде: реальные факты из данных каталога (страна, гарантия) +
          ручной текст про историю для брендов с прямым спросом в Wordstat
          (см. src/lib/brands.ts BRAND_SEO). Факты показываются для ЛЮБОГО
          бренда, где они есть в данных парсера — не только для топовых. */}
      {(seo.about || (stats && (stats.countries.length > 0 || stats.warrantyMin !== null || stats.hasLifetimeWarranty))) && (
        <div style={{
          marginTop: 20, padding: '22px 26px', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 16,
        }}>
          <div style={{ fontFamily: 'var(--fh)', fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
            О бренде {brandName}
          </div>
          {seo.about && (
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, margin: seo.about ? '0 0 14px' : 0 }}>
              {seo.about}
            </p>
          )}
          {stats && (stats.countries.length > 0 || stats.warrantyMin !== null || stats.hasLifetimeWarranty) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {stats.countries.length > 0 && (
                <div style={{
                  fontSize: 12.5, fontWeight: 500, background: 'var(--surface2)',
                  border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 20, color: 'var(--muted)',
                }}>
                  📍 Производство: {stats.countries.join(', ')}
                </div>
              )}
              {(stats.warrantyMin !== null || stats.hasLifetimeWarranty) && (
                <div style={{
                  fontSize: 12.5, fontWeight: 500, background: 'var(--surface2)',
                  border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 20, color: 'var(--muted)',
                }}>
                  ✅ Гарантия: {stats.warrantyMin !== null
                    ? (stats.warrantyMin === stats.warrantyMax ? `${stats.warrantyMin} лет` : `${stats.warrantyMin}–${stats.warrantyMax} лет`)
                    : ''}
                  {stats.warrantyMin !== null && stats.hasLifetimeWarranty ? ', на часть коллекций — пожизненная' : ''}
                  {stats.warrantyMin === null && stats.hasLifetimeWarranty ? 'пожизненная (по отдельным коллекциям)' : ''}
                </div>
              )}
              {stats.colorWarrantyMin !== null && (
                <div style={{
                  fontSize: 12.5, fontWeight: 500, background: 'var(--surface2)',
                  border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 20, color: 'var(--muted)',
                }}>
                  🎨 Гарантия на цвет: {stats.colorWarrantyMin === stats.colorWarrantyMax ? `${stats.colorWarrantyMin} лет` : `${stats.colorWarrantyMin}–${stats.colorWarrantyMax} лет`}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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

      {faq.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>
            Вопросы про {brandName}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faq.map((item, i) => {
              const isOpen = openFaq === i
              return (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface)',
                    border: `1.5px solid ${isOpen ? 'rgba(126,204,154,.4)' : 'var(--border)'}`,
                    borderRadius: 14,
                    overflow: 'hidden',
                    transition: 'border-color .2s',
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: 12,
                      padding: '16px 20px', background: 'none', border: 'none',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, flex: 1 }}>
                      {item.q}
                    </span>
                    <span style={{
                      fontSize: 18, color: isOpen ? '#7ecc9a' : 'var(--muted)',
                      transition: 'transform .25s, color .2s',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      flexShrink: 0, lineHeight: 1,
                    }}>+</span>
                  </button>
                  <div style={{ maxHeight: isOpen ? 400 : 0, overflow: 'hidden', transition: 'max-height .3s cubic-bezier(0.4,0,0.2,1)' }}>
                    <div style={{
                      padding: '0 20px 18px', fontSize: 14.5, lineHeight: 1.75, color: 'var(--muted)',
                      borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 0,
                    }}>
                      {item.a}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{
            marginTop: 16, padding: '16px 20px', background: 'rgba(126,204,154,.08)',
            border: '1px solid rgba(126,204,154,.25)', borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 26 }}>🛠️</span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Гарантийный случай по {brandName}?</div>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>Поможем оформить обращение к производителю — позвоните.</div>
            </div>
            <a
              href={`tel:${PHONE_NUMBER.replace(/[^\d+]/g, '')}`}
              style={{
                padding: '11px 20px', background: 'linear-gradient(135deg, #7ecc9a, #4caf70)',
                borderRadius: 10, color: '#0d1f14', fontWeight: 800, fontSize: 14.5,
                textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              📞 {PHONE_NUMBER}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
