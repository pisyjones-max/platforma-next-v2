// Журнал заказов и заявок — независимая от Telegram копия.
// Пишем в два места, чтобы хватало любого одного:
//   1) файл .data/orders.jsonl на сервере (работает без какой-либо настройки; путь можно
//      переопределить через ORDERS_LOG_FILE) — построчный JSON, последняя строка с тем же id побеждает;
//   2) Upstash KV, ключи order:<id> (если KV подключён).
// Просмотр: /admin/orders (ключ ADMIN_KEY).
import { promises as fs } from 'fs'
import path from 'path'
import { kvSet, kvGet, kvScanKeys, isKvConfigured } from './kv'
import type { CartItem, CheckoutForm } from '@/types/cart'

export interface LeadRecord {
  id: string
  kind: 'order' | 'callback' | 'card'
  createdAt: string // ISO
  tgDelivered: boolean
  form?: Partial<CheckoutForm>
  items?: CartItem[]
  total?: number
  phone?: string // для callback
  note?: string  // для callback: товар / текст заявки
}

const FILE = process.env.ORDERS_LOG_FILE || path.join(process.cwd(), '.data', 'orders.jsonl')

async function persist(rec: LeadRecord): Promise<void> {
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true })
    await fs.appendFile(FILE, JSON.stringify(rec) + '\n', 'utf8')
  } catch (e) {
    console.error('[ORDERS] file write error:', e)
  }
  if (isKvConfigured()) {
    try {
      await kvSet(`order:${rec.id}`, rec)
    } catch (e) {
      console.error('[ORDERS] KV write error:', e)
    }
  }
}

export async function saveLead(
  data: Omit<LeadRecord, 'id' | 'createdAt' | 'tgDelivered'>,
): Promise<LeadRecord> {
  // Ограничиваем размер: тело приходит от клиента, журнал не должен раздуваться мусором
  const clip = (v: unknown, n = 500) => String(v ?? '').slice(0, n)
  const form = data.form
    ? Object.fromEntries(Object.entries(data.form).map(([k, v]) => [k, typeof v === 'boolean' ? v : clip(v)]))
    : undefined
  const rec: LeadRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    tgDelivered: false,
    kind: data.kind,
    form: form as LeadRecord['form'],
    items: Array.isArray(data.items) ? data.items.slice(0, 100) : undefined,
    total: typeof data.total === 'number' ? data.total : undefined,
    phone: data.phone ? clip(data.phone, 50) : undefined,
    note: data.note ? clip(data.note, 2000) : undefined,
  }
  await persist(rec)
  return rec
}

export async function markDelivered(rec: LeadRecord): Promise<void> {
  await persist({ ...rec, tgDelivered: true })
}

export async function listLeads(): Promise<{ leads: LeadRecord[]; sources: { file: boolean; kv: boolean } }> {
  const map = new Map<string, LeadRecord>()
  const merge = (r: LeadRecord) => {
    if (!r?.id) return
    const prev = map.get(r.id)
    if (!prev || (r.tgDelivered && !prev.tgDelivered)) map.set(r.id, r)
  }

  let file = false
  try {
    const raw = await fs.readFile(FILE, 'utf8')
    file = true
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue
      try { merge(JSON.parse(line)) } catch {}
    }
  } catch {}

  let kv = false
  if (isKvConfigured()) {
    try {
      const keys = await kvScanKeys('order:*')
      const recs = await Promise.all(keys.map(k => kvGet<LeadRecord>(k).catch(() => null)))
      kv = true
      for (const r of recs) if (r && typeof r === 'object' && 'kind' in r) merge(r)
    } catch (e) {
      console.error('[ORDERS] KV list error:', e)
    }
  }

  const leads = [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { leads, sources: { file, kv } }
}
