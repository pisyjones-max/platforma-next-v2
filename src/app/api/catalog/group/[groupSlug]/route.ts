import { NextRequest, NextResponse } from 'next/server'
import { getGroupProducts } from '@/lib/groupProducts'

// Срез товаров раздела для клиентской подгрузки и фильтров: ?offset=24&limit=24
export async function GET(req: NextRequest, { params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params
  const all = getGroupProducts(groupSlug)
  if (all.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const sp = req.nextUrl.searchParams
  const offset = Math.max(0, parseInt(sp.get('offset') ?? '0', 10) || 0)
  const limit = Math.min(5000, Math.max(1, parseInt(sp.get('limit') ?? '24', 10) || 24))
  const products = all.slice(offset, offset + limit)
  return NextResponse.json({ products, total: all.length, hasMore: offset + limit < all.length })
}
