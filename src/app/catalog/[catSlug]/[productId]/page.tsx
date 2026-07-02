import { notFound } from 'next/navigation'
import { getCatalog, findCategory } from '@/lib/catalog'
import { findProductBySlug } from '@/lib/slug'
import { imgUrl } from '@/lib/image'
import { productSchema, breadcrumbSchema, jsonLdScriptProps } from '@/lib/schema'
import { SALE_RATE } from '@/lib/constants'
import { ProductPage } from '@/components/product/ProductPage'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ catSlug: string; productId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { catSlug, productId } = await params
  const catalog = getCatalog()
  const cat = findCategory(catalog, catSlug)
  const product = cat ? findProductBySlug(cat.products, productId) : undefined
  if (!product || !cat) return {}
  const v = product.variants[0]
  const price = Math.round(v.price * SALE_RATE)
  const priceStr = price > 0 ? `${price.toLocaleString('ru-RU')} ₽` : 'по запросу'

  // Собираем ключевые характеристики для description
  const featureSnippet = Object.entries(product.features ?? {})
    .slice(0, 3)
    .map(([k, val]) => `${k}: ${val}`)
    .join(', ')

  const desc = product.description?.trim()
    ? `${product.description.trim().slice(0, 120)}. Цена ${priceStr}. Доставка по МО.`
    : `${product.title}${featureSnippet ? '. ' + featureSnippet : ''}. Цена ${priceStr}. Скидка −17%. Доставка по Московской области. Звоните: +7 (933) 203-30-05.`

  return {
    title: `${product.title} — купить, цена ${priceStr}`,
    description: desc,
    alternates: { canonical: `/catalog/${catSlug}/${productId}` },
    openGraph: {
      title: `${product.title} — PLATFORMA`,
      description: `Цена ${priceStr}. Скидка −17%. Доставка по Московской области.`,
      images: v.images?.[0] ? [{ url: imgUrl(v.images[0]), alt: product.title }] : [],
    },
  }
}

export default async function ProductRoute({ params }: Props) {
  const { catSlug, productId } = await params
  const catalog = getCatalog()
  const cat = findCategory(catalog, catSlug)
  const product = cat ? findProductBySlug(cat.products, productId) : undefined
  if (!product || !cat) notFound()

  const parent = Object.entries(catalog.groups)
    .find(([, g]) => g.categories.includes(catSlug))

  const breadcrumbs = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    ...(parent ? [{ name: parent[1].name, url: `/catalog/group/${parent[0]}` }] : []),
    { name: cat.name, url: `/catalog/${catSlug}` },
    { name: product.title, url: `/catalog/${catSlug}/${productId}` },
  ])

  return (
    <>
      <script {...jsonLdScriptProps(productSchema(product, cat, catSlug, productId))} />
      <script {...jsonLdScriptProps(breadcrumbs)} />
      <ProductPage
        product={product}
        category={cat}
        groupSlug={parent?.[0] ?? ''}
        groupName={parent?.[1]?.name ?? ''}
      />
    </>
  )
}
