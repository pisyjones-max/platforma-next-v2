import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'
import type { Catalog } from '@/types/catalog'
import { findProductBySlug, productSlug } from '@/lib/slug'

// Edge-рантайм по умолчанию не даёт доступа к fs, а нам нужно читать
// catalog.json для решения коллизий slug. Node-рантайм для middleware
// стабилен в Next 15.2+/16.x; на более старых версиях включается флагом
// experimental.nodeMiddleware в next.config.ts.
export const runtime = 'nodejs'

const OLD_HOST = 'platforma-pro.vercel.app'
const NEW_ORIGIN = 'https://platforma-msk.ru'

const CATALOG_PATH = path.join(process.cwd(), 'public', 'catalog', 'catalog.json')
let cached: Catalog | null = null
let cachedMtimeMs = 0

function loadCatalog(): Catalog | null {
  try {
    const stat = fs.statSync(CATALOG_PATH)
    if (cached && stat.mtimeMs === cachedMtimeMs) return cached
    const raw = fs.readFileSync(CATALOG_PATH, 'utf-8')
    cached = JSON.parse(raw) as Catalog
    cachedMtimeMs = stat.mtimeMs
    return cached
  } catch {
    return cached
  }
}

function findProductAnywhere(catalog: Catalog, productId: string) {
  for (const c of catalog.categories) {
    const p = findProductBySlug(c.products, productId)
    if (p && p.variants?.length) return { cat: c, product: p }
  }
  return null
}

// /catalog/:catSlug/:productId — ровно 3 сегмента
const PRODUCT_PATH = /^\/catalog\/([^/]+)\/([^/]+)\/?$/

// Зарезервированные первые сегменты под /catalog/, которые НЕ являются
// slug категории товаров — это отдельные роуты (/catalog/brand/[slug],
// /catalog/group/[slug], см. src/app/catalog). Без этого исключения
// PRODUCT_PATH ошибочно матчил, например, /catalog/brand/docke как
// catSlug="brand" + productId="docke", не находил прямого совпадения и
// улетал в findProductAnywhere() — а там мог найтись товар с id,
// заканчивающимся на "-docke" (сайдинг, мембрана и т.д.), и страницу
// бренда 301-редиректило на случайный товар вместо самой себя. Ни один
// slug категории не совпадает с этими именами (проверено по catalog.json).
const RESERVED_CATALOG_SEGMENTS = new Set(['brand', 'group'])

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const { pathname, search } = request.nextUrl

  // 1. Старый домен → честный 301 на боевой
  if (host === OLD_HOST) {
    return NextResponse.redirect(new URL(pathname + search, NEW_ORIGIN), 301)
  }

  // 2. Trailing slash → честный 301 (штатное 308-поведение Next отключено
  //    в next.config.ts через skipTrailingSlashRedirect: true)
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.replace(/\/+$/, '')
    return NextResponse.redirect(url, 301)
  }

  // 3. Товар по устаревшему URL категории (переименованный/схлопнутый slug) →
  //    301 на актуальный адрес вместо 404. Раньше это делал permanentRedirect()
  //    из next/navigation внутри страницы товара — Next всегда отдаёт по нему
  //    308, что и было первопричиной жалобы в аудите.
  const match = pathname.match(PRODUCT_PATH)
  if (match) {
    const [, catSlug, productId] = match
    if (!RESERVED_CATALOG_SEGMENTS.has(catSlug)) {
      const catalog = loadCatalog()
      if (catalog) {
        const cat = catalog.categories.find(c => c.slug === catSlug)
        const directHit = cat ? findProductBySlug(cat.products, productId) : undefined
        if (!directHit || !directHit.variants?.length) {
          const fallback = findProductAnywhere(catalog, productId)
          if (fallback) {
            const url = request.nextUrl.clone()
            url.pathname = `/catalog/${fallback.cat.slug}/${productSlug(fallback.product.id)}`
            return NextResponse.redirect(url, 301)
          }
          // Ни прямого совпадения, ни где-либо ещё в каталоге — честный 404
          // без промежуточных редиректов, отдаёт сама страница товара (notFound()).
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
