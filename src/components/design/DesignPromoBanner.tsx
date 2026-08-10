import Link from 'next/link'
import { DESIGN_PROJECT_PRICE } from '@/lib/constants'

// Компактный промо-блок "бесплатный дизайн-проект дома" — вставляется на
// главной и ведёт на посадочную страницу /dizayn-proekt.
export function DesignPromoBanner() {
  return (
    <Link href="/dizayn-proekt" className="design-promo">
      <div className="design-promo-badge">🎁 Новое</div>
      <div className="design-promo-body">
        <div className="design-promo-title">
          Дизайн-проект вашего дома и участка — бесплатно
        </div>
        <div className="design-promo-sub">
          Пришлите фото дома — покажем, как он будет выглядеть с сайдингом, кровлей
          или фасадными панелями. Услуга стоит {DESIGN_PROJECT_PRICE} ₽, но бесплатна
          при оформлении карты лояльности.
        </div>
      </div>
      <div className="design-promo-cta">Примерить материалы →</div>
    </Link>
  )
}
