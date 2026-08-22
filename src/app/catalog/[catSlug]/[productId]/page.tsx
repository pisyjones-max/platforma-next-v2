import { notFound } from 'next/navigation'
import { getCatalog, findCategory, getCanonicalCategorySlug } from '@/lib/catalog'
import { findProductBySlug } from '@/lib/slug'
import { getCrossSellProducts } from '@/lib/crossSell'
import { imgUrl } from '@/lib/image'
import { breadcrumbSchema, faqSchema, jsonLdScriptProps } from '@/lib/schema'
import { normalizeBrand } from '@/lib/brandAliases'
import { getProductFaq } from '@/lib/productFaq'
import { SALE_RATE } from '@/lib/constants'
import { ProductPage } from '@/components/product/ProductPage'
import { ProductJsonLd } from '@/components/product/ProductJsonLd'
import type { Metadata } from 'next'

// См. комментарий в src/lib/catalog.ts — каталог читается с диска в рантайме,
// эта настройка даёт странице подхватывать свежие цены раз в 10 минут без
// пересборки и рестарта сайта.
export const revalidate = 600

interface Props {
  params: Promise<{ catSlug: string; productId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { catSlug, productId } = await params
  const catalog = getCatalog()
  const cat = findCategory(catalog, catSlug)
  const product = cat ? findProductBySlug(cat.products, productId) : undefined
  // Защита от "битых" записей парсера (пустой variants выдаёт краш вместо 404,
  // см. историю с 500-ошибками на ~150 товарных страницах, зафиксированную
  // в отчёте Яндекс.Вебмастера — товар временно пересобирался ночным парсером
  // без variants в момент обхода робота).
  if (!product || !cat || !product.variants?.length) return {}

  const v = product.variants[0]
  const price = Math.round(v.price * SALE_RATE)
  const priceStr = price > 0 ? `${price.toLocaleString('ru-RU')} ₽` : 'по запросу'
  const brand = normalizeBrand(product.features?.['Производитель'])
  // Артикул — самый надёжный якорь уникальности: у одинаковых по названию
  // товаров разных цветов/партий он всегда разный, в отличие от title.
  const sku = v.sku?.trim()

  // Собираем ключевые характеристики для description
  const featureSnippet = Object.entries(product.features ?? {})
    .slice(0, 3)
    .map(([k, val]) => `${k}: ${val}`)
    .join(', ')

  const titleSuffix = [brand, sku ? `арт. ${sku}` : ''].filter(Boolean).join(', ')

  const desc = product.description?.trim()
    ? `${product.description.trim().slice(0, 120)}. ${brand ? `Бренд ${brand}. ` : ''}${sku ? `Артикул ${sku}. ` : ''}Цена ${priceStr}. Доставка по МО.`
    : `${product.title}${featureSnippet ? '. ' + featureSnippet : ''}. ${brand ? `Бренд ${brand}. ` : ''}${sku ? `Артикул ${sku}. ` : ''}Цена ${priceStr}. Скидка −17%. Доставка по Московской области. Звоните: +7 (933) 203-30-05.`

  return {
    title: `${product.title}${titleSuffix ? ` (${titleSuffix})` : ''} — купить, цена ${priceStr}`,
    description: desc,
    // Товар может лежать сразу в нескольких категориях каталога (см.
    // getCanonicalCategorySlug) — canonical всегда указывает на единственную
    // "истинную" версию страницы, даже если открыта дублирующая категория.
    alternates: {
      canonical: `/catalog/${getCanonicalCategorySlug(catalog, product, catSlug)}/${productId}`,
    },
    openGraph: {
      title: `${product.title} — PLATFORMA`,
      description: `Цена ${priceStr}. Скидка −17%. Доставка по Московской области.`,
      images: v.images?.[0] ? [{ url: imgUrl(v.images[0]), alt: product.title }] : [],
    },
  }
}

export default async function ProductRoute({ params }: Props) {
  const { catSlug, productId } = await params
  const catalog = getCatalog()
  const cat = findCategory(catalog, catSlug)
  const product = cat ? findProductBySlug(cat.products, productId) : undefined

  // Защита от "битых" записей парсера: если товар нашёлся, но у него нет
  // валидных variants (пустой массив/temp-состояние ночной пересборки
  // catalog.json), рендерить страницу нельзя — ProductPage читает
  // product.variants[0].price без проверки и упадёт с 500 вместо честного
  // 404. Лучше отдать 404: он не бьёт индексацию так, как повторяющиеся
  // 500-ошибки, и страница переиндексируется сама на следующий обход,
  // как только парсер досыплет данные обратно.
  if (!product || !cat || !product.variants?.length) {
    notFound()
  }

  const parent = Object.entries(catalog.groups)
    .find(([, g]) => g.categories.includes(catSlug))

  const crossSellProducts = parent
    ? getCrossSellProducts(catalog, parent[0], product.id)
    : []

  // Для блока "Другие товары в категории" считаем на сервере лёгкий список
  // (id/название/цена/картинка максимум 8 штук) вместо передачи в клиентский
  // компонент category целиком со всеми товарами категории.
  const otherProducts = cat.products
    .filter(p => p.id !== product.id)
    .slice(0, 8)
    .map(p => ({
      id: p.id,
      title: p.title,
      price: p.variants[0]?.price ?? 0,
      image: p.variants[0]?.images?.[0],
    }))

  const breadcrumbs = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    ...(parent ? [{ name: parent[1].name, url: `/catalog/group/${parent[0]}` }] : []),
    { name: cat.name, url: `/catalog/${catSlug}` },
    { name: product.title, url: `/catalog/${catSlug}/${productId}` },
  ])

  const price = Math.round((product.variants[0]?.price ?? 0) * SALE_RATE)
  const faq = getProductFaq(product, cat, price)

  return (
    <>
      <ProductJsonLd product={product} category={cat} catSlug={catSlug} productSlug={productId} />
      <script {...jsonLdScriptProps(breadcrumbs)} />
      <script {...jsonLdScriptProps(faqSchema(faq))} />
      <ProductPage
        product={product}
        categorySlug={cat.slug}
        categoryName={cat.name}
        groupSlug={parent?.[0] ?? ''}
        groupName={parent?.[1]?.name ?? ''}
        otherProducts={otherProducts}
        crossSellProducts={crossSellProducts}
        faq={faq}
      />
    </>
  )
}
