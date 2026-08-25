import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { getAllArticles, getArticleBySlug } from '@/lib/blog'
import { SITE_URL } from '@/lib/site'
import { breadcrumbSchema } from '@/lib/schema'

export function generateStaticParams() {
  return getAllArticles().map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return {}
  return {
    title: `${article.title} — PLATFORMA`,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      publishedTime: article.publishedAt,
    },
  }
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return notFound()

  const html = marked.parse(article.bodyMarkdown, { async: false }) as string
  const related = (article.relatedArticles ?? [])
    .map(slug => getArticleBySlug(slug))
    .filter((a): a is NonNullable<typeof a> => !!a)

  const bcSchema = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    { name: 'Блог', url: '/blog' },
    { name: article.title, url: `/blog/${article.slug}` },
  ])

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    author: { '@type': 'Organization', name: 'PLATFORMA' },
    publisher: { '@type': 'Organization', name: 'PLATFORMA', logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.png` } },
    mainEntityOfPage: `${SITE_URL}/blog/${article.slug}`,
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px 80px' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <Link href="/blog" style={{ fontSize: 14, color: 'var(--muted)', textDecoration: 'none' }}>
        ← Все статьи
      </Link>

      <h1 style={{ fontFamily: 'var(--fh)', fontSize: 30, fontWeight: 800, margin: '16px 0 8px' }}>
        {article.title}
      </h1>
      <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32 }}>
        {new Date(article.publishedAt).toLocaleDateString('ru-RU')}
      </div>

      <div
        className="article-body"
        style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--fg)' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {related.length > 0 && (
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 12 }}>
            ПОХОЖИЕ СТАТЬИ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {related.map(a => (
              <Link key={a.slug} href={`/blog/${a.slug}`} style={{ fontSize: 14.5, color: 'var(--accent)', textDecoration: 'none' }}>
                {a.title} →
              </Link>
            ))}
          </div>
        </div>
      )}

      {article.relatedLinks && article.relatedLinks.length > 0 && (
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 12 }}>
            МАТЕРИАЛЫ ПО ТЕМЕ
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {article.relatedLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                style={{ padding: '10px 16px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 14, textDecoration: 'none', color: 'var(--fg)' }}
              >
                {l.label} →
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
