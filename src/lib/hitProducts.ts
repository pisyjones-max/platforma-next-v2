// Ручной список товаров с повышенным спросом ("Хит спроса" на карточке).
//
// ВАЖНО: у поставщика (mk4s.ru) нет поля с реальным остатком на складе, поэтому
// бейдж НЕ показывает "осталось мало" как факт о количестве — это было бы
// недостоверным утверждением (риск по закону о рекламе, та же логика, что и
// с ценами/картой лояльности). Вместо этого — честная формулировка про спрос,
// список товаров задаётся вручную ниже.
//
// Как добавить товар: скопируй `id` товара из catalog.json (поле "id" внутри
// products, не sku) и добавь строкой в массив.
export const HIT_PRODUCT_IDS: string[] = [
  // 'krovlya--myagkaya-krovlya--tehnonikol--roofmast--rufmast-kvadro-seryy-bazalt',
]

const HIT_SET = new Set(HIT_PRODUCT_IDS)

export function isHitProduct(id?: string): boolean {
  if (!id) return false
  return HIT_SET.has(id)
}
