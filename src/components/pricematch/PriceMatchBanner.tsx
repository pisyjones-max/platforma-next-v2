import Link from 'next/link'

// Компактный промо-блок "перебьём цену конкурента" — вставляется на главной,
// ведёт на посадочную страницу /deshevle-konkurentov с формой.
export function PriceMatchBanner() {
  return (
    <Link href="/deshevle-konkurentov" className="price-promo">
      <div className="price-promo-badge">💰 −5% гарантированно</div>
      <div className="price-promo-body">
        <div className="price-promo-title">
          Нашли дешевле у другого поставщика? Перебьём цену минимум на 5%
        </div>
        <div className="price-promo-sub">
          Пришлите нам скриншот или прайс конкурента с ценой на нужный материал —
          посчитаем и предложим цену ниже. Без обязательств.
        </div>
      </div>
      <div className="price-promo-cta">Прислать цену →</div>
    </Link>
  )
}
