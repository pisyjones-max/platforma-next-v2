import { SALE_RATE } from './constants'

export const salePrice = (raw: number) => Math.round(raw * SALE_RATE)

export const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU').format(Math.round(n))
