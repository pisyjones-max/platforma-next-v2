import Link from 'next/link'
import { SITE_ORDER_BONUS_POINTS } from '@/lib/loyaltyFeatures'

// Промо-блок "оформи заказ на сайте сам — получи баллы". Стимулирует
// самостоятельное оформление через корзину/чекаут вместо звонка/сообщения
// менеджеру. Ведёт на страницу карты лояльности.
export function SiteOrderBonusBanner() {
  return (
    <Link href="/loyalty-card" className="price-promo" id="site-order-bonus-banner">
      <div className="price-promo-body">
        <div className="price-promo-badge">🎁 Бонус за заказ на сайте</div>
        <div className="price-promo-title">
          Оформите заказ сами на сайте — получите +{SITE_ORDER_BONUS_POINTS} баллов сверх кэшбэка
        </div>
        <div className="price-promo-sub">
          Баллы начисляются автоматически на карту «Соседи» при оформлении через корзину на сайте,
          дополнительно к прогрессивному кэшбэку. Списать баллы можно у менеджера при следующей покупке.
        </div>
      </div>
      <div className="price-promo-cta">Получить карту →</div>
    </Link>
  )
}
