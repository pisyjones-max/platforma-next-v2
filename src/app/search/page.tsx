import Link from 'next/link'
import { searchProducts } from '@/lib/search'
import { ProductCard } from '@/components/catalog/ProductCard'
import type { Metadata } from 'next'

interface Props {
  searchParams: Promise<{ q?: string }>
}

const RESULT_LIMIT = 96

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  return {
    title: query ? `Поиск: «${query}»` : 'Поиск по каталогу',
    // Страницы результатов поиска не нужны в индексе Яндекса/Google
    robots: { index: false, follow: true },
    alternates: { canonical: '/search' },
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  const { results, total } = query ? searchProducts(query, RESULT_LIMIT) : { results: [], total: 0 }

  return (
    <div id="main">
      <nav className="breadcrumb">
        <span className="bc-item bc-link"><Link href="/">Каталог</Link></span>
        <span className="bc-sep">›</span>
        <span className="bc-item bc-cur">Поиск</span>
      </nav>

      <div className="hero">
        <div>
          <h1>{query ? `Результаты по запросу «${query}»` : 'Поиск по каталогу'}</h1>
          <p>Доставка по Московской области</p>
        </div>
        <div className="hero-right">
          <div className="hero-stat"><span>{total}</span><small>найдено</small></div>
        </div>
      </div>

      {!query && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
          Введите запрос в поле поиска в шапке сайта.
        </div>
      )}

      {query && (
        <>
          <div className="pgrid">
            {results.map(r => (
              <ProductCard
                key={r.id}
                id={r.id}
                title={r.title}
                price={r.price}
                img={r.img}
                sku={r.sku}
                href={r.href}
                description={r.description}
              />
            ))}
          </div>

          {results.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
              Ничего не найдено по запросу «{query}». Попробуйте другие слова.
            </div>
          )}

          {total > results.length && (
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13.5, marginTop: 16 }}>
              Показаны первые {results.length} из {total} найденных товаров. Уточните запрос, чтобы сузить результаты.
            </p>
          )}
        </>
      )}
    </div>
  )
}
