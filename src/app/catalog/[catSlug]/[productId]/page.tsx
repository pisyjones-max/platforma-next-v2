import { notFound } from 'next/navigation'
import { getCatalog, findCategory } from '@/lib/catalog'
import { ProductPage } from '@/components/product/ProductPage'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ catSlug: string; productId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { catSlug, productId } = await params
  const catalog = getCatalog()
  const cat = findCategory(catalog, catSlug)
  const product = cat?.products.find(p => p.id.split('--').pop() === productId || p.id === productId)
  if (!product || !cat) return {}
  const v = product.variants[0]
  const price = Math.round(v.price * 0.93)
  const priceStr = price > 0 ? `${price.toLocaleString('ru-RU')} ₽` : 'по запросу'

  // Собираем ключевые характеристики для description
  const featureSnippet = Object.entries(product.features ?? {})
    .slice(0, 3)
    .map(([k, val]) => `${k}: ${val}`)
    .join(', ')

  const desc = product.description?.trim()
    ? `${product.description.trim().slice(0, 120)}. Цена ${priceStr}. Доставка по МО.`
    : `${product.title}${featureSnippet ? '. ' + featureSnippet : ''}. Цена ${priceStr}. Скидка −7%. Доставка по Московской области. Звоните: +7 (933) 203-30-05.`

  return {
    title: `${product.title} — купить, цена ${priceStr}`,
    description: desc,
    alternates: { canonical: `/catalog/${catSlug}/${productId}` },
    openGraph: {
      title: `${product.title} — PLATFORMA`,
      description: `Цена ${priceStr}. Скидка −7%. Доставка по Московской области.`,
      images: v.images?.[0] ? [{ url: `/${v.images[0]}`, alt: product.title }] : [],
    },
  }
}

export default async function ProductRoute({ params }: Props) {
  const { catSlug, productId } = await params
  const catalog = getCatalog()
  const cat = findCategory(catalog, catSlug)
  const product = cat?.products.find(p => p.id.split('--').pop() === productId || p.id === productId)
  if (!product || !cat) notFound()

  const parent = Object.entries(catalog.groups)
    .find(([, g]) => g.categories.includes(catSlug))

  return (
    <ProductPage
      product={product}
      category={cat}
      groupSlug={parent?.[0] ?? ''}
      groupName={parent?.[1]?.name ?? ''}
    />
  )
}
