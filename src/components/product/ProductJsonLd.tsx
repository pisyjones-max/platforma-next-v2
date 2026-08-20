import { productSchema, jsonLdScriptProps } from '@/lib/schema'
import type { Product, Category } from '@/types/catalog'

interface Props {
  product: Product
  category: Category
  catSlug: string
  productSlug: string
}

/**
 * Product + Offer JSON-LD для страницы товара.
 * aggregateRating/review рендерятся внутри объекта ТОЛЬКО если у товара есть
 * реальные отзывы (product.reviewCount > 0) — см. productSchema() в lib/schema.ts.
 * Пустое/нулевое aggregateRating в разметке — то, за что Google Search Console
 * бьёт ошибкой "Missing field aggregateRating", поэтому поле либо есть
 * целиком с реальными цифрами, либо не рендерится вовсе.
 */
export function ProductJsonLd({ product, category, catSlug, productSlug }: Props) {
  const schema = productSchema(product, category, catSlug, productSlug)
  return <script {...jsonLdScriptProps(schema)} />
}
