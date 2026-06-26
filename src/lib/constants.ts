export const SALE_RATE      = 0.99          // наша цена = цена конкурента × 0.99
export const DISC_LABEL     = '−17%'        // маркетинговая скидка на бейдже
export const CASHBACK_RATE  = 0.005
export const PHONE_NUMBER   = '+7 (933) 203-30-05'
export const TG_TOKEN       = process.env.TG_TOKEN  ?? ''
export const TG_CHAT_ID     = process.env.TG_CHAT_ID ?? ''

// Вторая фирма — получает заказы параллельно (без контактов клиента)
export const TG_TOKEN_2     = process.env.TG_TOKEN_2  ?? ''
export const TG_CHAT_ID_2   = process.env.TG_CHAT_ID_2 ?? ''

// Объёмные скидки (применяются к итогу корзины)
export const VOLUME_DISCOUNTS: { from: number; label: string; rate: number }[] = [
  { from: 30_000,  label: 'от 30 000 ₽',  rate: 0.03 },
  { from: 60_000,  label: 'от 60 000 ₽',  rate: 0.05 },
  { from: 100_000, label: 'от 100 000 ₽', rate: 0.07 },
  { from: 200_000, label: 'от 200 000 ₽', rate: 0.10 },
]
