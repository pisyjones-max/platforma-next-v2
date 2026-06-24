export interface ProductVariant {
  sku: string
  sku_name?: string
  color?: string
  price: number
  pack_quantity?: number
  images?: string[]
}

export interface Product {
  id: string
  title: string
  name?: string
  description?: string
  features?: Record<string, string>
  rating?: number
  reviewCount?: number
  variants: ProductVariant[]
}

export interface Category {
  slug: string
  name: string
  products: Product[]
}

export interface Group {
  name: string
  categories: string[]
}

export interface CatalogMeta {
  total_products: number
  updated_at?: string
}

export interface Catalog {
  meta: CatalogMeta
  groups: Record<string, Group>
  categories: Category[]
}
