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

interface Props {
  params: Promise<{ catSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { catSlug } = await params
  const cat = findCategory(getCatalog(), catSlug)
  if (!cat) return {}
  const count = cat.products.length

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

  const minPrice = cat.products.reduce((min, p) => {
    const price = Math.round((p.variants[0]?.price ?? 0) * SALE_RATE)
    return price > 0 && price < min ? price : min
  }, 999999)
  const priceStr = minPrice < 999999 ? ` от ${minPrice.toLocaleString('ru-RU')} ₽` : ''
  return {
    title: `${cat.name} — купить в Московской области${priceStr}`,
    description: `${cat.name} — ${count} товаров в наличии. Цены${priceStr}. Доставка по МО. Скидка −17%. Самовывоз из Новохаритонова. Звоните: +7 (933) 203-30-05.`,
    alternates: { canonical: `/catalog/${catSlug}` },
    openGraph: {
      title: `${cat.name} — PLATFORMA`,
      description: `Купить ${cat.name.toLowerCase()} в Московской области. ${count} позиций. Скидка −17%.`,
    },
  }
}

export default async function CatalogCategoryPage({ params }: Props) {
  const { catSlug } = await params
  const catalog = getCatalog()
  const cat = findCategory(catalog, catSlug)
  if (!cat) notFound()
  const parent = getParentGroup(catalog, catSlug)

  const breadcrumbs = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    ...(parent ? [{ name: parent.group.name, url: `/catalog/group/${parent.slug}` }] : []),
    { name: cat.name, url: `/catalog/${catSlug}` },
  ])

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumbs)} />
      <CategoryPage category={cat} parentGroup={parent} />
    </>
  )
}
