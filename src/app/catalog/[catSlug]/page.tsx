import { notFound } from 'next/navigation'
import { getCatalog, findCategory, getParentGroup } from '@/lib/catalog'
import { breadcrumbSchema, jsonLdScriptProps } from '@/lib/schema'
import { SALE_RATE } from '@/lib/constants'
import { CategoryPage } from '@/components/catalog/CategoryPage'
import type { Metadata } from 'next'

// См. комментарий в src/lib/catalog.ts — каталог читается с диска в рантайме,
// эта настройка даёт странице подхватывать свежие цены раз в 10 минут без
// пересборки и рестарта сайта.
export const revalidate = 600

export const PAGE_SIZE = 24

interface Props {
  params: Promise<{ catSlug: string }>
  searchParams: Promise<{ page?: string }>
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw)
  return Number.isInteger(n) && n > 1 ? n : 1
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { catSlug } = await params
  const { page: pageParam } = await searchParams
  const cat = findCategory(getCatalog(), catSlug)
  if (!cat) return {}
  const count = cat.products.length
  const page = parsePage(pageParam)
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  // ?page=X всегда участвует в canonical для этой страницы — так каждая
  // страница пагинации остаётся отдельным индексируемым URL с уникальным
  // title/description вместо дубля контента 1-й страницы.
  const canonical = page > 1 ? `/catalog/${catSlug}?page=${page}` : `/catalog/${catSlug}`
  const pageSuffix = page > 1 ? ` — страница ${page}` : ''

  // Пустая категория: не выдумываем цены и наличие, которых нет, и просим
  // поисковики не индексировать — страница остаётся доступной (для клиента
  // и на случай скорого поступления товара), но не участвует в выдаче как
  // thin content. См. также sitemap.ts — такие категории туда не попадают.
  if (count === 0) {
    return {
      title: `${cat.name} — скоро в наличии | PLATFORMA`,
      description: `${cat.name} — товар временно отсутствует. Уточните сроки поступления по телефону +7 (933) 203-30-05.`,
      alternates: { canonical: `/catalog/${catSlug}` },
      robots: { index: false, follow: true },
    }
  }

  // Страница пагинации за пределами диапазона — не индексируем, чтобы не
  // плодить пустые/дублирующиеся ?page=N в выдаче.
  if (page > totalPages) {
    return {
      title: `${cat.name}${pageSuffix} | PLATFORMA`,
      alternates: { canonical },
      robots: { index: false, follow: false },
    }
  }

  const minPrice = cat.products.reduce((min, p) => {
    const price = Math.round((p.variants[0]?.price ?? 0) * SALE_RATE)
    return price > 0 && price < min ? price : min
  }, 999999)
  const priceStr = minPrice < 999999 ? ` от ${minPrice.toLocaleString('ru-RU')} ₽` : ''
  return {
    title: `${cat.name} — купить в Московской области${priceStr}${pageSuffix}`,
    description: page > 1
      ? `${cat.name}: товары ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, count)} из ${count}. Цены${priceStr}. Доставка по МО. Скидка −17%.`
      : `${cat.name} — ${count} товаров в наличии. Цены${priceStr}. Доставка по МО. Скидка −17%. Самовывоз из Новохаритонова. Звоните: +7 (933) 203-30-05.`,
    alternates: { canonical },
    robots: page > 1 ? { index: true, follow: true } : undefined,
    openGraph: {
      title: `${cat.name} — PLATFORMA${pageSuffix}`,
      description: `Купить ${cat.name.toLowerCase()} в Московской области. ${count} позиций. Скидка −17%.`,
    },
  }
}

export default async function CatalogCategoryPage({ params, searchParams }: Props) {
  const { catSlug } = await params
  const { page: pageParam } = await searchParams
  const catalog = getCatalog()
  const cat = findCategory(catalog, catSlug)
  if (!cat) notFound()
  const parent = getParentGroup(catalog, catSlug)

  const page = parsePage(pageParam)
  const totalPages = Math.max(1, Math.ceil(cat.products.length / PAGE_SIZE))
  if (page > totalPages) notFound()

  const pageProducts = cat.products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const breadcrumbs = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    ...(parent ? [{ name: parent.group.name, url: `/catalog/group/${parent.slug}` }] : []),
    { name: cat.name, url: `/catalog/${catSlug}` },
  ])

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumbs)} />
      <CategoryPage
        category={{ ...cat, products: pageProducts }}
        parentGroup={parent}
        totalCount={cat.products.length}
        page={page}
        totalPages={totalPages}
        catSlug={catSlug}
      />
    </>
  )
}
