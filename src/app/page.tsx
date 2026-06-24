import { getCatalog } from '@/lib/catalog'
import { GroupsPage } from '@/components/catalog/GroupsPage'

export default function Home() {
  const catalog = getCatalog()
  return <GroupsPage catalog={catalog} />
}
