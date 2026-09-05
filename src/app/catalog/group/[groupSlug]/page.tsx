import { notFound } from 'next/navigation'
import { getCatalog } from '@/lib/catalog'
import { getKrovlyaComparison, KROVLYA_FAQ } from '@/lib/krovlyaHub'
import { breadcrumbSchema, faqSchema, jsonLdScriptProps } from '@/lib/schema'
import { GroupDetailPage } from '@/components/catalog/GroupDetailPage'
import { RelatedBlogArticles } from '@/components/catalog/RelatedBlogArticles'
import { DistrictLinksBlock } from '@/components/catalog/DistrictLinksBlock'
import type { Metadata } from 'next'

// Каталог теперь читается с диска в рантайме (см. src/lib/catalog.ts), а не
// вшивается в билд — но без ISR-ревалидации Next.js всё равно закэширует
// эту страницу навсегда после первого рендера. Раз в 10 минут страница
// перегенерируется в фоне со свежими данными, без ребилда и рестарта.
export const revalidate = 600

// Группы, для которых у нас есть готовый сравнительный контент + FAQ
// (см. src/lib/krovlyaHub.ts) — сейчас только "Кровля", самый крупный
// разрыв контент/спрос по Wordstat после сайдинга (1,1 млн/мес, страница
// была голым листингом без сравнения материалов, SEO_ARCHITECTURE.md P1).
const KROVLYA_GROUP_SLUG = 'krovlya'

interface Props {
  params: Promise<{ groupSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { groupSlug } = await params
  const catalog = getCatalog()
  const group = catalog.groups[groupSlug]
  if (!group) return {}
  const catCount = group.categories.length

  if (groupSlug === KROVLYA_GROUP_SLUG) {
    return {
      title: 'Кровля для крыши дома — материалы, цены, как выбрать',
      description:
        'Металлочерепица, мягкая кровля, профнастил, фальцевая кровля, композитная и керамическая черепица — сравнение материалов и цены. Доставка по Московской области.',
      alternates: { canonical: `/catalog/group/${groupSlug}` },
      openGraph: {
        title: 'Кровля для крыши дома — материалы, цены, как выбрать',
        description: 'Сравнение кровельных материалов: металлочерепица, мягкая кровля, профнастил, фальц, черепица.',
      },
    }
  }

  return {
    title: `${group.name} — купить в Московской области`,
    description: `${group.name} — ${catCount} категорий в наличии. Доставка по Московской области. Самовывоз из Новохаритонова. Звоните: +7 (933) 203-30-05.`,
    alternates: { canonical: `/catalog/group/${groupSlug}` },
    openGraph: {
      title: `${group.name} — PLATFORMA`,
      description: `Купить ${group.name.toLowerCase()} в МО. Доставка и самовывоз.`,
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

  const isKrovlya = groupSlug === KROVLYA_GROUP_SLUG
  const comparison = isKrovlya ? getKrovlyaComparison(catalog) : undefined
  const faq = isKrovlya ? KROVLYA_FAQ : undefined

  const breadcrumbs = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    { name: group.name, url: `/catalog/group/${groupSlug}` },
  ])

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumbs)} />
      {isKrovlya && <script {...jsonLdScriptProps(faqSchema(KROVLYA_FAQ))} />}
      <GroupDetailPage
        groupSlug={groupSlug}
        group={group}
        categories={categories}
        comparison={comparison}
        faq={faq}
        calculatorHref={isKrovlya ? '/kalkulyator/krovli' : undefined}
      />
      <DistrictLinksBlock groupSlug={groupSlug} groupName={group.name} />
      <RelatedBlogArticles href={`/catalog/group/${groupSlug}`} />
    </>
  )
}
