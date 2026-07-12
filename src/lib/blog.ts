import fs from 'node:fs'
import path from 'node:path'

export type BlogArticle = {
  slug: string
  title: string
  description: string
  keywords: string[]
  publishedAt: string
  cluster: 'materials' | 'delivery' | 'seasonal' | 'comparison'
  city: string | null
  excerpt: string
  bodyMarkdown: string
}

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

/**
 * Читает все статьи из content/blog/*.json.
 * Специально без кэша модулей верхнего уровня — Next читает это на этапе билда
 * (generateStaticParams / sitemap), так что каждый npm run build подхватывает новые файлы
 * без правки кода.
 */
export function getAllArticles(): BlogArticle[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.json'))

  const articles = files.map(file => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8')
    return JSON.parse(raw) as BlogArticle
  })

  return articles.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
}

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return getAllArticles().find(a => a.slug === slug)
}
