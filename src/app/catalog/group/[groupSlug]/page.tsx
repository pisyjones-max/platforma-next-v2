import { notFound } from 'next/navigation'
import { getCatalog } from '@/lib/catalog'
import { GroupDetailPage } from '@/components/catalog/GroupDetailPage'

interface Props {
  params: Promise<{ groupSlug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { groupSlug } = await params
  const catalog = getCatalog()
  const group = catalog.groups[groupSlug]
  if (!group) return {}
  return { title: `${group.name} — PLATFORMA` }
}

export default async function GroupPage({ params }: Props) {
  const { groupSlug } = await params
  const catalog = getCatalog()
  const group = catalog.groups[groupSlug]
  if (!group) notFound()

  return <GroupDetailPage groupSlug={groupSlug} group={group} catalog={catalog} />
}
