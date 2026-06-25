import { NextResponse } from 'next/server'

// Static promos data - updated by the scraper cron job
// In production: store in Vercel KV or a JSON file updated by cron
// For now: hardcoded + manual update mechanism

export interface Promo {
  id: string
  brand: 'deke' | 'grandline' | 'technonicol'
  brandName: string
  title: string
  desc: string
  discount?: string
  url: string
  color: string
  emoji: string
  validUntil?: string
}

// This data is updated by /api/promos/update (called by Vercel Cron)
// and cached here as fallback
const STATIC_PROMOS: Promo[] = [
  {
    id: 'deke-spring-2025',
    brand: 'deke',
    brandName: 'Деке',
    title: 'Весенняя акция Döcke',
    desc: 'Скидка на битумную черепицу PREMIUM и ELITE при заказе от 10 уп.',
    discount: 'до −12%',
    url: 'https://docke.ru/news/',
    color: '#c0392b',
    emoji: '🏠',
    validUntil: '2025-06-30',
  },
  {
    id: 'grandline-2025',
    brand: 'grandline',
    brandName: 'Гранд Лайн',
    title: 'Акция Grand Line',
    desc: 'Металлочерепица и профлист — специальные цены при заказе от 50 м².',
    discount: 'от −8%',
    url: 'https://www.grandline.ru/akczii/',
    color: '#e67e22',
    emoji: '🔩',
    validUntil: '2025-06-30',
  },
  {
    id: 'technonicol-2025',
    brand: 'technonicol',
    brandName: 'ТехноНИКОЛЬ',
    title: 'Лето с ТехноНИКОЛЬ',
    desc: 'Утеплитель ТЕХНОФАС и ТЕХНОРУФ — акционные условия для строительного сезона.',
    discount: 'до −15%',
    url: 'https://shop.technonicol.ru/sale/',
    color: '#c0392b',
    emoji: '🌡️',
    validUntil: '2025-08-31',
  },
]

export async function GET() {
  // In future: try to read from Vercel KV or edge config
  // For now return static + any env-overridden promos
  const promos = STATIC_PROMOS.filter(p => {
    if (!p.validUntil) return true
    return new Date(p.validUntil) >= new Date()
  })

  return NextResponse.json({ promos, updatedAt: new Date().toISOString() })
}
