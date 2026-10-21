// Мини-CRM «база входящих лидов» — всё своё, на нашем Upstash Redis (kv.ts), без внешних сервисов.
//
// Ключи:
//   crm:lead:<vid>   JSON-карточка человека (vid — постоянный ID браузера, plt_vid)
//   crm:ev:<vid>     список событий (LPUSH, последние 200): заходы, просмотры, чат, заявки
//   crm:idx          ZSET vid → lastSeen (для списка «кто был недавно»)
//   crm:phone:<цифры> vid, за которым закреплён телефон (склейка одного человека с разных устройств)
//   crm:alias:<vid>  → основной vid, если карточки склеили
//   crm:sid:<sid>    vid по ID сессии чата (чтобы ответ менеджера лёг в нужную карточку)
//   crm:pg:<sid>:<h> NX-замок «эту страницу в этой сессии уже записали»
import { kvPipeline, isKvConfigured } from './kv'
import { normalizePhone, formatPhone } from './phone'

export type LeadStatus = 'new' | 'in_work' | 'won' | 'lost' | 'spam'
export const STATUSES: LeadStatus[] = ['new', 'in_work', 'won', 'lost', 'spam']

export interface ViewStat { p: string; title: string; n: number; last: number; product: boolean }

export interface Lead {
  vid: string
  name: string
  phone: string            // красивый, +7 (…)
  phoneKey: string         // цифры, 7XXXXXXXXXX
  email: string
  status: LeadStatus
  note: string
  firstSeen: number
  lastSeen: number
  visits: number           // сколько разных сессий
  sids: string[]           // последние сессии
  lastSid: string
  ref: string              // откуда пришёл в первый раз
  refLast: string
  utm: string              // первая метка, если была
  device: string
  city: string
  views: ViewStat[]        // чем интересовался (топ-40 страниц)
  msgs: number             // сообщений в чат от посетителя
  lastMsg: string
  orders: number
  requests: number         // callback / price-match / design / service
}

export type EventType = 'visit' | 'view' | 'chat_in' | 'chat_out' | 'order' | 'callback' | 'pricematch' | 'design' | 'service' | 'card' | 'note'
export interface CrmEvent { t: number; type: EventType; text?: string; p?: string; title?: string }

const K = {
  lead: (v: string) => `crm:lead:${v}`,
  ev: (v: string) => `crm:ev:${v}`,
  idx: 'crm:idx',
  phone: (d: string) => `crm:phone:${d}`,
  alias: (v: string) => `crm:alias:${v}`,
  sid: (s: string) => `crm:sid:${s}`,
}
export const VID_RE = /^[a-z0-9]{4,64}$/
const EV_MAX = 200
const SID_TTL = 30 * 86400

const cut = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n)
export const cleanVid = (v: unknown) => { const s = String(v ?? '').toLowerCase(); return VID_RE.test(s) ? s : '' }

// Русский номер в тексте сообщения: +7 999 123-45-67, 8(999)1234567 и т.п.
const PHONE_IN_TEXT = /(?:\+7|8|7)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/
export function phoneFromText(text: string): string {
  const m = PHONE_IN_TEXT.exec(text)
  return m ? normalizePhone(m[0]) ?? '' : ''
}

function blank(vid: string, now: number): Lead {
  return {
    vid, name: '', phone: '', phoneKey: '', email: '', status: 'new', note: '',
    firstSeen: now, lastSeen: now, visits: 0, sids: [], lastSid: '',
    ref: '', refLast: '', utm: '', device: '', city: '', views: [],
    msgs: 0, lastMsg: '', orders: 0, requests: 0,
  }
}

const parse = <T>(raw: unknown): T | null => {
  if (typeof raw !== 'string') return null
  try { return JSON.parse(raw) as T } catch { return null }
}

/** Основной vid с учётом склейки карточек */
async function resolveVid(vid: string): Promise<string> {
  const [a] = await kvPipeline([['GET', K.alias(vid)]])
  return typeof a === 'string' && a ? a : vid
}

export async function getLead(vid: string): Promise<Lead | null> {
  if (!isKvConfigured() || !vid) return null
  const main = await resolveVid(vid)
  const [raw] = await kvPipeline([['GET', K.lead(main)]])
  return parse<Lead>(raw)
}

async function saveLead(l: Lead) {
  await kvPipeline([
    ['SET', K.lead(l.vid), JSON.stringify(l)],
    ['ZADD', K.idx, l.lastSeen, l.vid],
  ])
}

async function pushEvent(vid: string, ev: CrmEvent) {
  await kvPipeline([
    ['LPUSH', K.ev(vid), JSON.stringify(ev)],
    ['LTRIM', K.ev(vid), 0, EV_MAX - 1],
  ])
}

export async function getEvents(vid: string): Promise<CrmEvent[]> {
  const [arr] = await kvPipeline([['LRANGE', K.ev(vid), 0, EV_MAX - 1]])
  return (Array.isArray(arr) ? arr : []).map(r => parse<CrmEvent>(r)).filter((e): e is CrmEvent => !!e)
}

// ── Склейка двух карточек одного человека (по телефону) ────────
async function mergeInto(primary: Lead, other: Lead): Promise<Lead> {
  const views = new Map<string, ViewStat>()
  for (const v of [...primary.views, ...other.views]) {
    const x = views.get(v.p)
    if (x) { x.n += v.n; x.last = Math.max(x.last, v.last) } else views.set(v.p, { ...v })
  }
  const merged: Lead = {
    ...primary,
    name: primary.name || other.name,
    email: primary.email || other.email,
    firstSeen: Math.min(primary.firstSeen, other.firstSeen),
    lastSeen: Math.max(primary.lastSeen, other.lastSeen),
    visits: primary.visits + other.visits,
    sids: [...new Set([...primary.sids, ...other.sids])].slice(-20),
    ref: primary.ref || other.ref,
    utm: primary.utm || other.utm,
    city: primary.city || other.city,
    views: [...views.values()].sort((a, b) => b.n - a.n).slice(0, 40),
    msgs: primary.msgs + other.msgs,
    orders: primary.orders + other.orders,
    requests: primary.requests + other.requests,
    note: [primary.note, other.note].filter(Boolean).join('\n'),
  }
  // события второй карточки переносим в основную
  const evs = await getEvents(other.vid)
  if (evs.length) {
    await kvPipeline(evs.slice().reverse().map(e => ['RPUSH', K.ev(primary.vid), JSON.stringify(e)]))
  }
  await kvPipeline([
    ['SET', K.alias(other.vid), primary.vid],
    ['ZREM', K.idx, other.vid],
    ['DEL', K.lead(other.vid)],
    ['DEL', K.ev(other.vid)],
  ])
  return merged
}

export interface Touch {
  vid: string
  sid?: string
  name?: string
  phone?: string
  email?: string
  ref?: string
  utm?: string
  device?: string
  city?: string
  /** новая сессия (первый пинг вкладки) */
  newVisit?: boolean
  view?: { p: string; title?: string }
  event?: Omit<CrmEvent, 't'>
  counters?: Partial<Pick<Lead, 'msgs' | 'orders' | 'requests'>>
  lastMsg?: string
}

const isProductPath = (p: string) => /^\/catalog\/[^/]+\/[^/]+/.test(p)

/** Единая точка записи в CRM: обновляет карточку, события и индексы. Никогда не бросает наружу. */
export async function crmTouch(t: Touch): Promise<Lead | null> {
  try {
    if (!isKvConfigured()) return null
    const vid0 = cleanVid(t.vid)
    if (!vid0) return null
    const now = Date.now()
    let vid = await resolveVid(vid0)
    const [raw] = await kvPipeline([['GET', K.lead(vid)]])
    let lead = parse<Lead>(raw) ?? blank(vid, now)

    lead.lastSeen = now
    if (t.name && !lead.name) lead.name = cut(t.name, 60)
    if (t.email && !lead.email) lead.email = cut(t.email, 100)
    if (t.ref) { if (!lead.ref) lead.ref = cut(t.ref, 120); lead.refLast = cut(t.ref, 120) }
    if (t.utm && !lead.utm) lead.utm = cut(t.utm, 120)
    if (t.device) lead.device = t.device
    if (t.city) lead.city = cut(t.city, 60)

    if (t.sid) {
      await kvPipeline([['SET', K.sid(t.sid), vid, 'EX', SID_TTL]])
      if (!lead.sids.includes(t.sid)) {
        lead.sids = [...lead.sids, t.sid].slice(-20)
        lead.visits += 1
        if (!t.newVisit) { /* сессия появилась не с первого пинга — визит всё равно считаем */ }
        await pushEvent(vid, { t: now, type: 'visit', text: t.ref ? `с ${cut(t.ref, 60)}` : 'прямой заход' })
      }
      lead.lastSid = t.sid
    }

    if (t.view) {
      const p = cut(t.view.p, 200)
      const title = cut(t.view.title, 120).replace(/\s*[|—–-]\s*PLATFORMA.*$/i, '').trim()
      const v = lead.views.find(x => x.p === p)
      if (v) { v.n += 1; v.last = now; if (title) v.title = title }
      else lead.views.push({ p, title, n: 1, last: now, product: isProductPath(p) })
      lead.views = lead.views.sort((a, b) => b.last - a.last).slice(0, 40)
      await pushEvent(vid, { t: now, type: 'view', p, title })
    }

    if (t.counters) {
      for (const k of ['msgs', 'orders', 'requests'] as const) {
        if (t.counters[k]) lead[k] += t.counters[k] as number
      }
    }
    if (t.lastMsg) lead.lastMsg = cut(t.lastMsg, 200)
    if (t.event) await pushEvent(vid, { t: now, ...t.event, text: cut(t.event.text, 500) })

    // Телефон: закрепляем и склеиваем карточки одного человека
    const norm = t.phone ? normalizePhone(t.phone) : null
    if (norm && norm !== lead.phoneKey) {
      lead.phoneKey = norm
      lead.phone = formatPhone(norm)
      const [owner] = await kvPipeline([['GET', K.phone(norm)]])
      const ownerVid = typeof owner === 'string' && owner !== vid ? owner : ''
      if (ownerVid) {
        const [oraw] = await kvPipeline([['GET', K.lead(ownerVid)]])
        const other = parse<Lead>(oraw)
        if (other) {
          // основной — старейшая карточка
          if (other.firstSeen <= lead.firstSeen) {
            const merged = await mergeInto(other, lead)
            merged.phone = lead.phone; merged.phoneKey = lead.phoneKey
            await kvPipeline([['SET', K.alias(vid), other.vid]])
            lead = merged; vid = other.vid
          } else {
            lead = await mergeInto(lead, other)
          }
        }
      }
      await kvPipeline([['SET', K.phone(norm), vid]])
    }

    lead.vid = vid
    await saveLead(lead)
    return lead
  } catch (e) {
    console.error('[CRM] touch error:', e)
    return null
  }
}

/** Страницу в этой сессии записываем один раз (NX-замок на 30 минут) */
export async function firstViewInSession(sid: string, path: string): Promise<boolean> {
  try {
    let h = 0
    for (let i = 0; i < path.length; i++) h = (h * 31 + path.charCodeAt(i)) | 0
    const [r] = await kvPipeline([['SET', `crm:pg:${sid}:${(h >>> 0).toString(36)}`, 1, 'EX', 1800, 'NX']])
    return r === 'OK'
  } catch { return false }
}

/** Событие по ID сессии чата (ответ менеджера из Telegram/админки) */
export async function crmEventBySid(sid: string, ev: Omit<CrmEvent, 't'>) {
  try {
    if (!isKvConfigured()) return
    const [v] = await kvPipeline([['GET', K.sid(sid)]])
    if (typeof v !== 'string' || !v) return
    const vid = await resolveVid(v)
    await pushEvent(vid, { t: Date.now(), ...ev, text: cut(ev.text, 500) })
  } catch (e) { console.error('[CRM] event error:', e) }
}

// ── Для админки ────────────────────────────────────────────────
export async function listLeads(limit = 300): Promise<Lead[]> {
  if (!isKvConfigured()) return []
  const [vids] = await kvPipeline([['ZREVRANGE', K.idx, 0, limit - 1]])
  const ids: string[] = Array.isArray(vids) ? vids : []
  if (!ids.length) return []
  const raws = await kvPipeline(ids.map(v => ['GET', K.lead(v)]))
  return raws.map(r => parse<Lead>(r)).filter((l): l is Lead => !!l)
}

export async function updateLead(vid: string, patch: Partial<Pick<Lead, 'status' | 'note' | 'name' | 'email'>> & { phone?: string }) {
  const main = await resolveVid(vid)
  const [raw] = await kvPipeline([['GET', K.lead(main)]])
  const lead = parse<Lead>(raw)
  if (!lead) return null
  if (patch.status && STATUSES.includes(patch.status)) lead.status = patch.status
  if (typeof patch.note === 'string') lead.note = cut(patch.note, 2000).replace(/\u0000/g, '')
  if (typeof patch.name === 'string') lead.name = cut(patch.name, 60)
  if (typeof patch.email === 'string') lead.email = cut(patch.email, 100)
  await saveLead(lead)
  if (patch.phone) return crmTouch({ vid: lead.vid, phone: patch.phone })
  return lead
}
