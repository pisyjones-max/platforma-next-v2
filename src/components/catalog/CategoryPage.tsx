'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ProductCard } from './ProductCard'
import { useFilters } from '@/hooks/useFilters'
import { findProduct } from '@/lib/catalog'
import { DISC_LABEL } from '@/lib/constants'
import type { Category, Catalog } from '@/types/catalog'

interface Props {
  category: Category
  parentGroup: { slug: string; group: { name: string } } | null
  catalog: Catalog
}

export function CategoryPage({ category, parentGroup, catalog }: Props) {
  const { search, setSearch, filtered } = useFilters(category.products)

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
          style={{ padding: '0 14px', width: 220, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, height: 32, borderRadius: 20, outline: 'none' }}
          placeholder="🔍 Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="rcnt">{filtered.length} товаров</span>
      </div>

      <div className="pgrid">
        {filtered.map(p => {
          const pid = p.id.split('--').pop() ?? p.id
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
  )
}
