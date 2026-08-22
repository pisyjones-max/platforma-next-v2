import { NextResponse } from 'next/server'
import { getCatalog, findCategory } from '@/lib/catalog'
import { PAGE_SIZE } from '@/lib/constants'

// Отдаёт JSON-срез товаров категории для клиентской подгрузки ("Загрузить ещё").
// Использует ту же getCatalog()/PAGE_SIZE, что и серверный рендер страницы
// категории, — значит нумерация страниц гарантированно совпадает и дозагрузка
// не может задвоить или пропустить товары относительно первой SSR-страницы.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ catSlug: string; page: string }> }
) {
  const { catSlug, page: pageParam } = await params
  const catalog = getCatalog()
  const cat = findCategory(catalog, catSlug)
  if (!cat) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const page = Number(pageParam)
  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json({ error: 'invalid_page' }, { status: 400 })
  }

  const totalPages = Math.max(1, Math.ceil(cat.products.length / PAGE_SIZE))
  const products = cat.products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return NextResponse.json({
    products,
    page,
    totalPages,
    hasMore: page < totalPages,
  })
}
