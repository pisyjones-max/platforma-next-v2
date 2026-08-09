import { getCatalog } from '@/lib/catalog'
import { GroupsPage } from '@/components/catalog/GroupsPage'

// См. комментарий в src/lib/catalog.ts — каталог читается с диска в рантайме,
// эта настройка даёт главной странице подхватывать изменения раз в 10 минут
// без пересборки и рестарта сайта.
export const revalidate = 600

export default function Home() {
  const catalog = getCatalog()
  // Передаём в клиентский компонент только то, что реально используется на
  // главной странице (названия групп + счётчик категорий, общее число
  // товаров) — а НЕ весь каталог со всеми ~1900 товарами и их описаниями.
  // Раньше сюда передавался catalog целиком, из-за чего Next.js сериализовал
  // весь JSON каталога (500K+ строк) в HTML главной страницы для гидратации.
  const groups = Object.fromEntries(
    Object.entries(catalog.groups).map(([slug, g]) => [
      slug,
      { name: g.name, categoriesCount: g.categories.length },
    ])
  )
  return <GroupsPage groups={groups} totalProducts={catalog.meta?.total_products ?? 0} />
}
