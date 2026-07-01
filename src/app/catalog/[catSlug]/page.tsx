import { notFound } from 'next/navigation'
import { getCatalog, findCategory, getParentGroup } from '@/lib/catalog'
import { breadcrumbSchema, jsonLdScriptProps } from '@/lib/schema'
import { CategoryPage } from '@/components/catalog/CategoryPage'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ catSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { catSlug } = await params
  const cat = findCategory(getCatalog(), catSlug)
  if (!cat) return {}
  const count = cat.products.length
  const minPrice = cat.products.reduce((min, p) => {
    const price = Math.round((p.variants[0]?.price ?? 0) * 0.93)
    return price > 0 && price < min ? price : min
  }, 999999)
  const priceStr = minPrice < 999999 ? ` от ${minPrice.toLocaleString('ru-RU')} ₽` : ''
  return {
    title: `${cat.name} — купить в Московской области${priceStr}`,
    description: `${cat.name} — ${count} товаров в наличии. Цены${priceStr}. Доставка по МО. Скидка −17%. Самовывоз из Ногинска. Звоните: +7 (933) 203-30-05.`,
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
      <CategoryPage category={cat} parentGroup={parent} catalog={catalog} />
    </>
  )
}
