import { notFound } from 'next/navigation'
import { getCatalog } from '@/lib/catalog'
import { GroupDetailPage } from '@/components/catalog/GroupDetailPage'
import type { Metadata } from 'next'

// Каталог теперь читается с диска в рантайме (см. src/lib/catalog.ts), а не
// вшивается в билд — но без ISR-ревалидации Next.js всё равно закэширует
// эту страницу навсегда после первого рендера. Раз в 10 минут страница
// перегенерируется в фоне со свежими данными, без ребилда и рестарта.
export const revalidate = 600

interface Props {
  params: Promise<{ groupSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { groupSlug } = await params
  const catalog = getCatalog()
  const group = catalog.groups[groupSlug]
  if (!group) return {}
  const catCount = group.categories.length
  return {
    title: `${group.name} — купить в Московской области`,
    description: `${group.name} — ${catCount} категорий в наличии. Доставка по Московской области. Скидка −17% на всё. Самовывоз из Новохаритонова. Звоните: +7 (933) 203-30-05.`,
    alternates: { canonical: `/catalog/group/${groupSlug}` },
    openGraph: {
      title: `${group.name} — PLATFORMA`,
      description: `Купить ${group.name.toLowerCase()} в МО. Скидка −17%. Доставка и самовывоз.`,
    },
  }
}

export default async function GroupPage({ params }: Props) {
  const { groupSlug } = await params
  const catalog = getCatalog()
  const group = catalog.groups[groupSlug]
  if (!group) notFound()

  // Считаем сводку по категориям на сервере и передаём в клиентский компонент
  // только slug/название/число товаров — а не весь каталог с товарами внутри.
  const categories = group.categories
    .map(slug => catalog.categories.find(c => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map(c => ({ slug: c.slug, name: c.name, productsCount: c.products.length }))

  return <GroupDetailPage groupSlug={groupSlug} group={group} categories={categories} />
}
