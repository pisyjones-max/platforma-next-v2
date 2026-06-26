/**
 * Генерирует URL-slug товара из его id.
 * Используется и в sitemap.ts и в поиске товара по URL.
 * id пример: "plastikovye--soedinitel-zheloba" или "krovlya--myagkaya-krovlya--tehnonikol--rufmast-kvadro"
 */
export function productSlug(id: string): string {
  const parts = id.split('--')
  // Берём последние 2 сегмента чтобы избежать коллизий между категориями
  return parts.length >= 2 ? parts.slice(-2).join('-') : parts[0]
}

/**
 * Ищет товар в категории по productId из URL
 */
export function findProductBySlug(products: { id: string }[], productId: string) {
  return products.find(p =>
    productSlug(p.id) === productId ||
    p.id.split('--').pop() === productId ||  // обратная совместимость со старыми URL
    p.id === productId
  )
}
