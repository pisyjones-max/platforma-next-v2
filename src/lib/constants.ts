export const PAGE_SIZE       = 24           // товаров на странице категории (SSR-пагинация и "Загрузить ещё")
export const SITE_DISCOUNT_RUB = 1          // наша цена = цена mk4s.ru − 1 ₽ (фиксированная сумма, не процент)
export const CASHBACK_RATE  = 0.005

// Приветственный бонус на карту лояльности — начисляется баллами при оформлении
// карты (любой источник). Списание баллов происходит не автоматически по правилу,
// а на усмотрение менеджера при оформлении заказа (см. /admin/cards).
export const CARD_WELCOME_BONUS = 15000
export const ADMIN_KEY      = process.env.ADMIN_KEY ?? ''   // секретный ключ для /admin/cards
export const PHONE_NUMBER   = '+7 (933) 203-30-05'

// Услуга "Дизайн-проект дома" — реальная стоимость услуги. Бесплатно для
// клиента при оформлении карты лояльности: сумма зачисляется на карту
// бонусом и используется при последующей покупке материалов по проекту.
export const DESIGN_PROJECT_PRICE = 2700
export const TG_TOKEN       = process.env.TG_TOKEN  ?? ''
export const TG_CHAT_ID     = process.env.TG_CHAT_ID ?? ''

// Рабочие часы менеджеров (МСК) — единый источник для футера и таймера
// "успей оформить сегодня" на карточке товара. Заказы, оформленные до
// окончания рабочего дня, обрабатываются менеджером в тот же день;
// это НЕ обещание даты доставки (она зависит от города, см. src/lib/cities.ts).
export const WORK_HOURS = {
  weekday: { start: 9, end: 18 },  // Пн–Пт
  saturday: { start: 9, end: 14 }, // Сб
  // Вс — выходной
}

// Вторая фирма — получает заказы параллельно (без контактов клиента)
export const TG_TOKEN_2     = process.env.TG_TOKEN_2  ?? ''
export const TG_CHAT_ID_2   = process.env.TG_CHAT_ID_2 ?? ''
