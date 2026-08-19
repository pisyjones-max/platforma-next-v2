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
import type { Category } from '@/types/catalog'

interface Props {
  category: Category
  parentGroup: { slug: string; group: { name: string } } | null
}

export function CategoryPage({ category, parentGroup }: Props) {
  const { filters, setFilters, search, setSearch, filtered, reset } = useFilters(category.products)
  const [brandModalOpen, setBrandModalOpen] = useState(false)

  // Счётчики по брендам считаются только по товарам текущей категории
  const brandFacets = useMemo(() => getBrandFacets(category.products), [category.products])

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
          <div className="hero-stat"><span>{category.products.length}</span><small>товаров</small></div>
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
        </div>
      </div>
    </div>
  )
}
