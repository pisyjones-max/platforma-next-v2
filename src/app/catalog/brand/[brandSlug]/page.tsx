import { notFound } from 'next/navigation'
import { getCatalog } from '@/lib/catalog'
import { findBrandBySlug, getBrandProducts, getBrandSeo, getBrandStats, getBrandFaq } from '@/lib/brands'
import { breadcrumbSchema, faqSchema, jsonLdScriptProps } from '@/lib/schema'
import { BrandPage } from '@/components/catalog/BrandPage'
import type { Metadata } from 'next'

// См. комментарий в src/lib/catalog.ts — каталог читается с диска в рантайме,
// эта настройка даёт странице подхватывать новые товары раз в 10 минут без
// пересборки и рестарта сайта (как остальные страницы каталога).
export const revalidate = 600

interface Props {
  params: Promise<{ brandSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brandSlug } = await params
  const catalog = getCatalog()
  const brand = findBrandBySlug(catalog, brandSlug)
  if (!brand) return {}
  const seo = getBrandSeo(brand.name, brand.count)
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/catalog/brand/${brandSlug}` },
    openGraph: {
      title: `${brand.name} — PLATFORMA`,
      description: seo.description,
    },
  }
}

export default async function BrandRoutePage({ params }: Props) {
  const { brandSlug } = await params
  const catalog = getCatalog()
  const brand = findBrandBySlug(catalog, brandSlug)
  if (!brand) notFound()

  const seo = getBrandSeo(brand.name, brand.count)
  const items = getBrandProducts(catalog, brand.name)
  const stats = getBrandStats(catalog, brand.name)
  const faq = getBrandFaq(brand.name, stats)

  const breadcrumbs = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    { name: 'Бренды', url: '/catalog/brand' },
    { name: brand.name, url: `/catalog/brand/${brandSlug}` },
  ])

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumbs)} />
      <script {...jsonLdScriptProps(faqSchema(faq))} />
      <BrandPage brandName={brand.name} seo={seo} items={items} categoryFacets={brand.categories} stats={stats} faq={faq} />
    </>
  )
}
