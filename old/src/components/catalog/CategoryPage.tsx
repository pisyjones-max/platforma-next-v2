'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ProductCard } from './ProductCard'
import { FilterBar } from './FilterBar'
import { Calculator } from '@/components/calculator/Calculator'
import { ProductModal } from '@/components/product/ProductModal'
import { useFilters } from '@/hooks/useFilters'
import { salePrice } from '@/lib/price'
import { findProduct } from '@/lib/catalog'
import type { Category, Catalog } from '@/types/catalog'

interface Props {
  category: Category
  parentGroup: { slug: string; group: { name: string } } | null
  catalog: Catalog
}

export function CategoryPage({ category, parentGroup, catalog }: Props) {
  const [modalId, setModalId] = useState<string | null>(null)
  const { filters, setFilters, search, setSearch, filtered, reset } = useFilters(category.products)

  const allColors = [...new Set(
    category.products.flatMap(p => p.variants.map(v => v.color ?? v.sku_name ?? '')).filter(Boolean)
  )]
  const maxPrice = Math.max(...category.products.map(p => salePrice(p.variants[0].price)), 0)
  const modalProduct = modalId ? (findProduct(catalog, modalId) ?? null) : null

  return (
    <main>
      <nav className="breadcrumb">
        <span className="bc-item bc-link"><Link href="/">Каталог</Link></span>
        {parentGroup && (
          <>
            <span className="bc-sep">›</span>
            <span className="bc-item bc-link">
              <Link href={`/catalog/group/${parentGroup.slug}`}>{parentGroup.group.name}</Link>
            </span>
          </>
        )}
        <span className="bc-sep">›</span>
        <span className="bc-item bc-cur">{category.name}</span>
      </nav>

      <div className="hero">
        <div>
          <h1>{category.name}</h1>
          <p>Высококачественные кровельные материалы · Доставка по России</p>
        </div>
        <div className="hero-right">
          <div className="hero-stat"><span>{category.products.length}</span><small>товаров</small></div>
          <div className="hero-badge"><div className="hero-badge-val">−7%</div><div className="hero-badge-lbl">скидка</div></div>
        </div>
      </div>

      <Calculator catSlug={category.slug} catName={category.name} product={category.products[0]} />

      <FilterBar
        filters={filters} setFilters={setFilters}
        search={search} setSearch={setSearch}
        colors={allColors} brands={[]}
        maxPrice={maxPrice} onReset={reset}
      />

      <div className="pgrid">
        {filtered.map(p => (
          <ProductCard key={p.id} product={p} onOpen={setModalId} />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
            Ничего не найдено
          </div>
        )}
      </div>

      <ProductModal product={modalProduct} onClose={() => setModalId(null)} />
    </main>
  )
}
