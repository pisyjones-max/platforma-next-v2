import { NextRequest, NextResponse } from 'next/server'
import { searchProducts } from '@/lib/search'

// Лёгкий API-роут для подсказок поиска в шапке (dropdown при вводе).
// Полная страница результатов /search считает то же самое напрямую на
// сервере, без похода через HTTP — этот роут нужен только клиентским
// компонентам (SearchBox) для live-подсказок.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  const limitParam = request.nextUrl.searchParams.get('limit')
  const parsedLimit = parseInt(limitParam ?? '', 10)
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 6

  const { results, total } = searchProducts(q, limit)

  return NextResponse.json(
    { query: q, total, results },
    { headers: { 'Cache-Control': 'private, max-age=30' } }
  )
}
