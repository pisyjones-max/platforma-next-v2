export const SALE_RATE      = 0.99          // наша цена = цена конкурента × 0.99
export const DISC_LABEL     = '−17%'        // маркетинговая скидка на бейдже
export const CASHBACK_RATE  = 0.005
export const CARD_DISCOUNT  = 0.05          // доп. скидка по карте PLATFORMA поверх обычной цены (как "цена с картой Ozon")
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
