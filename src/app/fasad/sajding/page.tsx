import { getCatalog } from '@/lib/catalog'
import { getSidingOptions, SIDING_FAQ } from '@/lib/sidingHub'
import { breadcrumbSchema, faqSchema, jsonLdScriptProps } from '@/lib/schema'
import { SidingHubPage } from '@/components/catalog/SidingHubPage'
import { RelatedBlogArticles } from '@/components/catalog/RelatedBlogArticles'
import type { Metadata } from 'next'

// См. комментарий в src/lib/catalog.ts — каталог читается с диска в рантайме,
// цены и кол-во товаров на хабе подхватываются раз в 10 минут без пересборки.
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Сайдинг для дома — виды, цены, как выбрать',
  description:
    'Виниловый, металлический, фиброцементный, цокольный сайдинг и панели под дерево — сравнение видов и цены. Купить сайдинг Docke и другие бренды. Доставка по Московской области.',
  alternates: { canonical: '/fasad/sajding' },
  openGraph: {
    title: 'Сайдинг для дома — виды, цены, как выбрать',
    description: 'Сравнение видов сайдинга: винил, металл, фиброцемент, цоколь, под дерево. Цены и как выбрать.',
  },
}

export default function SajdingPage() {
  const catalog = getCatalog()
  const options = getSidingOptions(catalog)

  const breadcrumbs = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    { name: 'Сайдинг', url: '/fasad/sajding' },
  ])

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumbs)} />
      <script {...jsonLdScriptProps(faqSchema(SIDING_FAQ))} />
      <SidingHubPage options={options} faq={SIDING_FAQ} />
      <RelatedBlogArticles href="/fasad/sajding" />
    </>
  )
}
