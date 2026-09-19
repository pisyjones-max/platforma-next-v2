import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_KEY } from '@/lib/constants'
import { listLeads } from '@/lib/orderStore'

export const dynamic = 'force-dynamic'

function checkAuth(req: NextRequest): boolean {
  if (!ADMIN_KEY) return false
  const key = req.headers.get('x-admin-key') ?? new URL(req.url).searchParams.get('key')
  return key === ADMIN_KEY
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(await listLeads(), { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[ADMIN] list orders error:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
