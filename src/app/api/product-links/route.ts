import { NextRequest, NextResponse } from 'next/server'
import { productPathBySku } from '@/lib/orderLinks'

// Корзина хранится в localStorage без ссылок на карточки (старые позиции тоже),
// поэтому ссылки подтягиваем по SKU: { skus: [...] } -> { links: { sku: '/catalog/...' } }
export async function POST(req: NextRequest) {
  let skus: unknown
  try { ({ skus } = await req.json()) } catch { return NextResponse.json({ links: {} }) }
  const links: Record<string, string> = {}
  if (Array.isArray(skus)) {
    for (const s of skus.slice(0, 60)) {
      if (typeof s !== 'string' || s.length > 200) continue
      const path = productPathBySku(s)
      if (path) links[s] = path
    }
  }
  return NextResponse.json({ links })
}
