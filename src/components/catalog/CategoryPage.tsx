'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ProductCard } from './ProductCard'
import { BrandFilter } from './BrandFilter'
import { useFilters } from '@/hooks/useFilters'
import { findProduct } from '@/lib/catalog'
import { DISC_LABEL } from '@/lib/constants'
import { getBrandFacets } from '@/lib/brandAliases'
import { productSlug } from '@/lib/slug'
import type { Category, Product } from '@/types/catalog'

interface Props {
  category: Category
  parentGroup: { slug: string; group: { name: string } } | null
  totalCount?: number
  page?: number
  totalPages?: number
  catSlug?: string
}

export function CategoryPage({ category, parentGroup, totalCount, page = 1, totalPages = 1, catSlug }: Props) {
  // Товары накапливаются в state по мере "Загрузить ещё" — первая порция
  // приходит с сервера (SSR, для краулера и первого отображения), следующие
  // подгружаются через /api/catalog/[catSlug]/page/[page] без перезагрузки.
  // Инициализируется из серверных props только один раз при монтировании.
  // При переходе на другую категорию или напрямую на другой ?page=N родитель
  // (src/app/catalog/[catSlug]/page.tsx) монтирует CategoryPage заново с
  // key={`${catSlug}-${page}`} — так state гарантированно пересоздаётся под
  // новый URL, без лишнего useEffect с синхронным setState.
  const [products, setProducts] = useState<Product[]>(category.products)
  const [loadedPage, setLoadedPage] = useState(page)
  const [hasMore, setHasMore] = useState(page < totalPages)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadMore = async () => {
    if (loadingMore || !hasMore || !catSlug) return
    setLoadingMore(true)
    try {
      const nextPage = loadedPage + 1
      const res = await fetch(`/api/catalog/${catSlug}/page/${nextPage}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: { products: Product[]; hasMore: boolean } = await res.json()
      setProducts(prev => [...prev, ...data.products])
      setLoadedPage(nextPage)
      setHasMore(data.hasMore)
    } catch (e) {
      console.error('[CategoryPage] Не удалось подгрузить товары:', e)
    } finally {
      setLoadingMore(false)
    }
  }

  const { filters, setFilters, search, setSearch, filtered, reset } = useFilters(products)
  const [brandModalOpen, setBrandModalOpen] = useState(false)

  // Счётчики по брендам считаются по уже подгруженным товарам категории
  const brandFacets = useMemo(() => getBrandFacets(products), [products])

  const toggleBrand = (name: string) => {
    setFilters(f => ({
      ...f,
      brand: f.brand.includes(name) ? f.brand.filter(b => b !== name) : [...f.brand, name],
    }))
  }

  const clearBrand = () => setFilters(f => ({ ...f, brand: [] }))

  const hasActiveFilters = filters.brand.length > 0 || search.length > 0

  return (
    <div id="main">
      <nav className="breadcrumb">
        <span className="bc-item bc-link"><Link href="/">Каталог</Link></span>
        {parentGroup && (
          <><span className="bc-sep">›</span>
          <span className="bc-item bc-link">
            <Link href={`/catalog/group/${parentGroup.slug}`}>{parentGroup.group.name}</Link>
          </span></>
        )}
        <span className="bc-sep">›</span>
        <span className="bc-item bc-cur">{category.name}</span>
      </nav>

      <div className="hero">
        <div>
          <h1>{category.name}</h1>
          <p>Доставка по Московской области · Скидка −17% на всё</p>
        </div>
        <div className="hero-right">
          <div className="hero-stat"><span>{totalCount ?? category.products.length}</span><small>товаров</small></div>
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
        {brandFacets.length > 0 && (
          <button
            type="button"
            className={`fchip brand-mobile-btn ${filters.brand.length > 0 ? 'active' : ''}`}
            onClick={() => setBrandModalOpen(true)}
          >
            Бренд{filters.brand.length > 0 ? ` (${filters.brand.length})` : ''}
          </button>
        )}
        {hasActiveFilters && (
          <button type="button" className="btn-sm" onClick={reset}>Сбросить фильтры</button>
        )}
        <span className="rcnt">{filtered.length} товаров</span>
      </div>

      <div className="cat-layout">
        {brandFacets.length > 0 && (
          <BrandFilter
            facets={brandFacets}
            selected={filters.brand}
            onToggle={toggleBrand}
            onClear={clearBrand}
            mobileOpen={brandModalOpen}
            onMobileClose={() => setBrandModalOpen(false)}
          />
        )}

        <div className="cat-main">
          {category.products.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '56px 24px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 16,
            }}>
              <div style={{ fontSize: 34, marginBottom: 12 }}>📦</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
                Товар временно отсутствует
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 14.5, maxWidth: 420, margin: '0 auto 20px' }}>
                Мы регулярно обновляем ассортимент «{category.name.toLowerCase()}». Позвоните — уточним сроки
                поступления или подберём аналог из наличия.
              </p>
              <a
                href="tel:+79332033005"
                className="btn-sm primary"
                style={{ display: 'inline-block', padding: '11px 22px', textDecoration: 'none' }}
              >
                📞 +7 (933) 203-30-05
              </a>
            </div>
          ) : (
          <div className="pgrid">
            {filtered.map(p => {
              // productSlug() — та же функция, что использует findProductBySlug() на
              // странице товара и sitemap.ts. Раньше здесь был "сырой" p.id.split('--').pop(),
              // который не убирал пробелы/кириллицу в id (косяки парсера) и не решал
              // коллизии одинаковых суффиксов между брендами внутри категории — из-за
              // этого часть карточек вела на 404 (напр. .../termopaneli-fasadnye/sand-glatt).
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
          )}
          {/* "Загрузить ещё" — прогрессивное улучшение поверх обычной
              постраничной ссылки ?page=N. Ссылка настоящая (href на реальный
              /catalog/[catSlug]?page=N), поэтому краулер без JS просто перейдёт
              по ней на следующую SSR-страницу и увидит её как самостоятельный
              200 OK URL с уникальным title/description (см. generateMetadata
              в src/app/catalog/[catSlug]/page.tsx) — это и есть та самая
              цепочка canonical/пагинации, которая нужна для индексации.
              У пользователя с включённым JS клик перехватывается и товары
              подгружаются на этой же странице без перезагрузки. */}
          {totalPages > 1 && catSlug && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 28 }}>
              {hasMore ? (
                <Link
                  href={`/catalog/${catSlug}?page=${loadedPage + 1}`}
                  className="btn-sm primary"
                  style={{ padding: '11px 28px', opacity: loadingMore ? 0.6 : 1, pointerEvents: loadingMore ? 'none' : undefined }}
                  onClick={e => { e.preventDefault(); loadMore() }}
                  aria-busy={loadingMore}
                >
                  {loadingMore ? 'Загружаем…' : 'Загрузить ещё'}
                </Link>
              ) : (
                <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>
                  Показаны все {totalCount ?? products.length} товаров
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
