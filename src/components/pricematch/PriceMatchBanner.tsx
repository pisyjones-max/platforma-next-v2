import Link from 'next/link'

// Компактный промо-блок "перебьём цену конкурента" — вставляется на главной,
// ведёт на посадочную страницу /deshevle-konkurentov с формой.
export function PriceMatchBanner() {
  return (
    <Link href="/deshevle-konkurentov" className="price-promo">
      <div className="price-promo-badge">💰 Предложим цену ниже</div>
      <div className="price-promo-body">
        <div className="price-promo-title">
          Нашли дешевле у другого поставщика? Посмотрим и предложим цену ниже
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
