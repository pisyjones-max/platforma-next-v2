import { notFound } from 'next/navigation'
import { getCatalog } from '@/lib/catalog'
import { GroupDetailPage } from '@/components/catalog/GroupDetailPage'
import type { Metadata } from 'next'

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
    description: `${group.name} — ${catCount} категорий в наличии. Доставка по Московской области. Скидка −7% на всё. Самовывоз из Ногинска. Звоните: +7 (933) 203-30-05.`,
    alternates: { canonical: `/catalog/group/${groupSlug}` },
    openGraph: {
      title: `${group.name} — PLATFORMA`,
      description: `Купить ${group.name.toLowerCase()} в МО. Скидка −7%. Доставка и самовывоз.`,
    },
  }
}

export default async function GroupPage({ params }: Props) {
  const { groupSlug } = await params
  const catalog = getCatalog()
  const group = catalog.groups[groupSlug]
  if (!group) notFound()
  return <GroupDetailPage groupSlug={groupSlug} group={group} catalog={catalog} />
}
