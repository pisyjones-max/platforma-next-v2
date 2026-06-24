import { getCatalog, findCategory, getParentGroup } from '@/lib/catalog'
import { CategoryPage } from '@/components/catalog/CategoryPage'
import { notFound } from 'next/navigation'

interface Props { params: { catSlug: string } }

export async function generateMetadata({ params }: Props) {
  const catalog = await getCatalog()
  const cat = findCategory(catalog, params.catSlug)
  if (!cat) return {}
  return {
    title: `${cat.name} — PLATFORMA`,
    description: `Купить ${cat.name} с доставкой по Московской области`,
  }
}

export default async function CatalogCategoryPage({ params }: Props) {
  const catalog = await getCatalog()
  const cat = findCategory(catalog, params.catSlug)
  if (!cat) notFound()
  const parent = getParentGroup(catalog, params.catSlug)
  return <CategoryPage category={cat} parentGroup={parent} catalog={catalog} />
}
