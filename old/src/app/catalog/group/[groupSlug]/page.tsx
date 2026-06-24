import { getCatalog } from '@/lib/catalog'
import { GroupDetailPage } from '@/components/catalog/GroupDetailPage'
import { notFound } from 'next/navigation'

interface Props { params: { groupSlug: string } }

export default async function GroupPage({ params }: Props) {
  const catalog = await getCatalog()
  const group = catalog.groups[params.groupSlug]
  if (!group) notFound()
  return <GroupDetailPage groupSlug={params.groupSlug} group={group} catalog={catalog} />
}
