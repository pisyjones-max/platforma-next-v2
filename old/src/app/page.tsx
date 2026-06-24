import { getCatalog } from '@/lib/catalog'
import { GroupsPage } from '@/components/catalog/GroupsPage'

export default async function Home() {
  const catalog = await getCatalog()
  return <GroupsPage catalog={catalog} />
}
