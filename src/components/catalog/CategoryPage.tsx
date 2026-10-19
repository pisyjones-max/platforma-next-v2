'use client'
import Link from 'next/link'
import { ProductListing, type PageResult } from './ProductListing'
import { productSlug } from '@/lib/slug'
import type { Category } from '@/types/catalog'

interface Props {
  category: Category
  parentGroup: { slug: string; group: { name: string } } | null
  totalCount?: number
  page?: number
  totalPages?: number
  catSlug?: string
}

export function CategoryPage({ category, parentGroup, totalCount, page = 1, totalPages = 1, catSlug }: Props) {
  // Первая порция приходит с сервера (SSR, для краулера и первого отображения),
  // остальное ProductListing подгружает через /api/catalog/[catSlug]/page/[page].
  // Родитель монтирует CategoryPage заново с key={`${catSlug}-${page}`}, поэтому
  // state списка пересоздаётся под новый URL.
  const fetchPage = catSlug
    ? async (n: number): Promise<PageResult> => {
        const res = await fetch(`/api/catalog/${catSlug}/page/${n}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      }
    : undefined

  return (
    <div id="main">
      <nav className="breadcrumb">
        <span className="bc-item bc-link"><Link href="/">Каталог</Link></span>
        {parentGroup && (
          <><span className="bc-sep"> › </span>
          <span className="bc-item bc-link">
            <Link href={`/catalog/group/${parentGroup.slug}`}>{parentGroup.group.name}</Link>
          </span></>
        )}
        <span className="bc-sep"> › </span>
        <span className="bc-item bc-cur">{category.name}</span>
      </nav>

      <div className="hero">
        <div>
          <h1>{category.name}</h1>
          <p>Доставка по Московской области · Цены ниже конкурентов</p>
        </div>
        <div className="hero-right">
          <div className="hero-stat"><span>{totalCount ?? category.products.length}</span><small>товаров</small></div>
        </div>
      </div>

      <ProductListing
        initialProducts={category.products}
        totalCount={totalCount ?? category.products.length}
        page={page}
        totalPages={totalPages}
        fetchPage={fetchPage}
        loadMoreHref={n => `/catalog/${catSlug}?page=${n}`}
        getHref={p => `/catalog/${category.slug}/${productSlug(p.id)}`}
        emptyName={category.name}
      />
    </div>
  )
}
