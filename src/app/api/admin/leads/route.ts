import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_KEY } from '@/lib/constants'
import { isKvConfigured } from '@/lib/kv'
import { listLeads, getLead, getEvents, updateLead, cleanVid, STATUSES, type Lead, type LeadStatus } from '@/lib/crmStore'

function checkAuth(req: NextRequest): boolean {
  if (!ADMIN_KEY) return false
  const key = req.headers.get('x-admin-key') ?? new URL(req.url).searchParams.get('key')
  return key === ADMIN_KEY
}

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
const dt = (ts: number) => new Date(ts).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })

function toCsv(leads: Lead[]): string {
  const head = ['Имя', 'Телефон', 'Email', 'Статус', 'Первый визит', 'Последний визит', 'Визитов', 'Сообщений', 'Заказов', 'Заявок', 'Откуда', 'Метка', 'Город', 'Устройство', 'Смотрел', 'Заметка']
  const rows = leads.map(l => [
    l.name, l.phone, l.email, l.status, dt(l.firstSeen), dt(l.lastSeen), l.visits, l.msgs, l.orders, l.requests,
    l.ref, l.utm, l.city, l.device,
    l.views.filter(v => v.product).slice(0, 5).map(v => v.title || v.p).join(' | '),
    l.note,
  ])
  // BOM, чтобы Excel открыл кириллицу
  return '\uFEFF' + [head, ...rows].map(r => r.map(csvCell).join(';')).join('\r\n')
}

// GET                 — список лидов (последние 300)
// GET ?vid=…          — карточка + лента событий
// GET ?format=csv     — выгрузка в CSV (Excel)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isKvConfigured()) return NextResponse.json({ error: 'kv_not_configured' }, { status: 503 })
  try {
    const sp = new URL(req.url).searchParams
    const vid = cleanVid(sp.get('vid'))
    if (vid) {
      const lead = await getLead(vid)
      if (!lead) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      return NextResponse.json({ lead, events: await getEvents(lead.vid) })
    }
    const leads = await listLeads(300)
    if (sp.get('format') === 'csv') {
      return new NextResponse(toCsv(leads), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }
    return NextResponse.json({ leads })
  } catch (e) {
    console.error('[CRM] admin list error:', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// POST { vid, status?, note?, name?, email?, phone? } — правка карточки менеджером
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isKvConfigured()) return NextResponse.json({ error: 'kv_not_configured' }, { status: 503 })
  let b: Record<string, unknown>
  try { b = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const vid = cleanVid(b.vid)
  if (!vid) return NextResponse.json({ error: 'bad_vid' }, { status: 400 })
  const status = STATUSES.includes(b.status as LeadStatus) ? (b.status as LeadStatus) : undefined
  try {
    const lead = await updateLead(vid, {
      status,
      note: typeof b.note === 'string' ? b.note : undefined,
      name: typeof b.name === 'string' ? b.name : undefined,
      email: typeof b.email === 'string' ? b.email : undefined,
      phone: typeof b.phone === 'string' && b.phone ? b.phone : undefined,
    })
    if (!lead) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json({ ok: true, lead })
  } catch (e) {
    console.error('[CRM] admin update error:', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
