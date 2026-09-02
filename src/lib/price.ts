import { SITE_DISCOUNT_RUB } from './constants'

// Наша цена = цена конкурента (mk4s.ru) минус фиксированная сумма (1 ₽), а не процент.
export const salePrice = (raw: number) => Math.max(0, Math.round(raw) - SITE_DISCOUNT_RUB)

export const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU').format(Math.round(n))
