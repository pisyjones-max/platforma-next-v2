import Link from 'next/link'
import { getArticlesForHref } from '@/lib/blog'

export function RelatedBlogArticles({ href }: { href: string }) {
  const articles = getArticlesForHref(href)
  if (articles.length === 0) return null

  return (
    <div style={{ marginTop: 32, padding: '20px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 12 }}>
        ЧИТАЙТЕ В БЛОГЕ
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {articles.map(a => (
          <Link key={a.slug} href={`/blog/${a.slug}`} style={{ fontSize: 14.5, color: 'var(--accent)', textDecoration: 'none' }}>
            {a.title} →
          </Link>
        ))}
      </div>
    </div>
  )
}
