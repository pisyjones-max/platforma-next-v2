import { notFound } from 'next/navigation'
import { getCatalog, findCategory, getParentGroup } from '@/lib/catalog'
import { CategoryPage } from '@/components/catalog/CategoryPage'

interface Props {
  params: Promise<{ catSlug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { catSlug } = await params
  const cat = findCategory(getCatalog(), catSlug)
  if (!cat) return {}
  return { title: `${cat.name} — PLATFORMA` }
}

export default async function CatalogCategoryPage({ params }: Props) {
  const { catSlug } = await params
  const catalog = getCatalog()
  const cat = findCategory(catalog, catSlug)
  if (!cat) notFound()
  const parent = getParentGroup(catalog, catSlug)
  return <CategoryPage category={cat} parentGroup={parent} catalog={catalog} />
}
