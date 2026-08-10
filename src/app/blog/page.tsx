import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllArticles } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Блог — PLATFORMA',
  description: 'Статьи о выборе кровельных и строительных материалов, доставке и ценах в Раменском округе.',
  alternates: { canonical: '/blog' },
}

export default function BlogIndexPage() {
  const articles = getAllArticles()

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 80px' }}>
      <h1 style={{ fontFamily: 'var(--fh)', fontSize: 30, fontWeight: 800, marginBottom: 24 }}>
        Блог PLATFORMA
      </h1>

      <div style={{ display: 'grid', gap: 16 }}>
        {articles.map(a => (
          <Link
            key={a.slug}
            href={`/blog/${a.slug}`}
            style={{
              display: 'block',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '20px 24px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
              {new Date(a.publishedAt).toLocaleDateString('ru-RU')}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{a.title}</div>
            <div style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.5 }}>{a.excerpt}</div>
          </Link>
        ))}

        {articles.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>Статьи скоро появятся.</p>
        )}
      </div>
    </div>
  )
}
