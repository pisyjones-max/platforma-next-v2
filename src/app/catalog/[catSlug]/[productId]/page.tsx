import { notFound } from 'next/navigation'
import { getCatalog, findCategory } from '@/lib/catalog'
import { ProductPage } from '@/components/product/ProductPage'

interface Props {
  params: Promise<{ catSlug: string; productId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { catSlug, productId } = await params
  const catalog = getCatalog()
  const cat = findCategory(catalog, catSlug)
  const product = cat?.products.find(p => p.id.split('--').pop() === productId || p.id === productId)
  if (!product) return {}
  const v = product.variants[0]
  const price = Math.round(v.price * 0.93)
  return {
    title: `${product.title} — купить в PLATFORMA, цена ${price} ₽`,
    description: `${product.title}. Цена от ${price} ₽. Доставка по Московской области. Скидка −7%. Звоните: +7 (933) 203-30-05`,
    openGraph: {
      title: product.title,
      images: v.images?.[0] ? [`/${v.images[0]}`] : [],
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
