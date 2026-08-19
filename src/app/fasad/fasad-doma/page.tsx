import { getCatalog } from '@/lib/catalog'
import { getFacadeOptions, FACADE_FAQ } from '@/lib/facadeHub'
import { breadcrumbSchema, faqSchema, jsonLdScriptProps } from '@/lib/schema'
import { FacadeHubPage } from '@/components/catalog/FacadeHubPage'
import type { Metadata } from 'next'

// См. комментарий в src/lib/catalog.ts — каталог читается с диска в рантайме,
// цены и кол-во товаров на хабе подхватываются раз в 10 минут без пересборки.
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Отделка фасада дома — материалы и цены',
  description:
    'Сайдинг, фасадная плитка, клинкер, термопанели, утепление — сравнение материалов для отделки фасада. Цены от производителя, скидка −17%. Доставка по Московской области.',
  alternates: { canonical: '/fasad/fasad-doma' },
  openGraph: {
    title: 'Отделка фасада дома — материалы и цены',
    description: 'Сравнение материалов для фасада: сайдинг, плитка, клинкер, термопанели, утепление.',
  },
}

export default function FasadDomaPage() {
  const catalog = getCatalog()
  const options = getFacadeOptions(catalog)

  const breadcrumbs = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    { name: 'Фасад дома', url: '/fasad/fasad-doma' },
  ])

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumbs)} />
      <script {...jsonLdScriptProps(faqSchema(FACADE_FAQ))} />
      <FacadeHubPage options={options} faq={FACADE_FAQ} />
    </>
  )
}
