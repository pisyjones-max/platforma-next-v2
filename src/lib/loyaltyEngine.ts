import { CASHBACK_TIERS, POINTS_EXPIRY_DAYS, LOYALTY_FEATURES } from '@/lib/loyaltyFeatures'
import { CASHBACK_RATE } from '@/lib/constants'

export interface CardRecord {
  name?: string
  issuedAt?: number
  source?: string
  bonus?: number
  bonusReason?: string
  points?: number
  purchases?: number       // сколько заказов зачтено по карте
  lastActivityAt?: number  // последняя покупка/начисление — от неё считается сгорание баллов
  referredBy?: string      // телефон того, кто пригласил (нормализованный)
  referralCount?: number   // сколько людей привёл сам
  email?: string           // необязательно, для рассылок/письма с картой
  intent?: string          // что ответил в квизе на /sosedi — видно менеджеру сразу
}

// Ставка кэшбэка для N-й (1-indexed) покупки по карте
export function cashbackRateFor(purchaseNumber: number): number {
  if (!LOYALTY_FEATURES.progressiveCashback) return CASHBACK_RATE
  const idx = Math.max(0, purchaseNumber - 1)
  return CASHBACK_TIERS[Math.min(idx, CASHBACK_TIERS.length - 1)]
}

// Сгорели ли баллы по правилу неактивности (мягкая, ленивая проверка — без фоновой джобы)
export function pointsExpired(rec: CardRecord): boolean {
  if (!LOYALTY_FEATURES.pointsExpiry) return false
  const anchor = rec.lastActivityAt ?? rec.issuedAt ?? 0
  if (!anchor) return false
  return Date.now() - anchor > POINTS_EXPIRY_DAYS * 24 * 60 * 60 * 1000
}

// Баланс баллов с учётом сгорания — то, что реально можно показать клиенту/менеджеру
export function effectivePoints(rec: CardRecord): number {
  return pointsExpired(rec) ? 0 : (rec.points ?? 0)
}

export function expiresAt(rec: CardRecord): number | null {
  if (!LOYALTY_FEATURES.pointsExpiry) return null
  const anchor = rec.lastActivityAt ?? rec.issuedAt
  return anchor ? anchor + POINTS_EXPIRY_DAYS * 24 * 60 * 60 * 1000 : null
}

// Реферальная ссылка — код это просто нормализованный телефон реферера
export function referralLink(baseUrl: string, referrerPhone: string): string {
  return `${baseUrl.replace(/\/$/, '')}/loyalty-card?ref=${encodeURIComponent(referrerPhone)}`
}
