// Общее хранилище живого чата: присутствие посетителей, журнал переписки, «печатает», «прочитано».
// Всё лежит в Upstash Redis через kv.ts — ничего нового ставить не нужно.
import { kvGet, kvSet, kvSetEx, kvMget } from './kv'
import { crmEventBySid } from './crmStore'

export const SID_RE = /^[a-z0-9]{4,32}$/
export const PRESENCE_TTL = 86400      // помним посетителя сутки
export const ONLINE_MS = 70_000        // «на сайте», если пинг был не позже 70 сек назад
export const TYPING_MS = 6_000         // «печатает», если сигнал был не позже 6 сек назад

export interface Presence {
  sid: string
  name: string
  page: string
  pages: { p: string; t: number }[]
  firstSeen: number
  lastSeen: number
  typingAt: number
  chatOpen: boolean
  visible: boolean
  gone: boolean
  mobile: boolean
  ref: string
}

export interface LogMsg { id: number; from: 'visitor' | 'manager'; text: string; ts: number }
export interface ManagerMsg { text: string; ts: number; updateId: number }

export const kPresence = (sid: string) => `chatv:${sid}`
export const kLog = (sid: string) => `chatlog:${sid}`
export const kManager = (sid: string) => `chat:${sid}`
export const kRead = (sid: string) => `chatread:${sid}`
export const kMgrTyping = (sid: string) => `chatmt:${sid}`
export const K_ADMIN_ONLINE = 'chatadmin:online'

export async function savePresence(p: Presence) {
  await kvSetEx(kPresence(p.sid), p, PRESENCE_TTL)
}

export async function appendLog(sid: string, from: LogMsg['from'], text: string, ts = Date.now()) {
  const list = (await kvGet<LogMsg[]>(kLog(sid))) ?? []
  const last = list[list.length - 1]
  list.push({ id: Math.max(ts, (last?.id ?? 0) + 1), from, text, ts })
  await kvSet(kLog(sid), list.slice(-100))
}

// Ответ менеджера (из Telegram или из админки): кладём в очередь для виджета и в журнал.
// updateId всегда растёт — иначе виджет (фильтр updateId > lastId) потеряет сообщения.
export async function addManagerMessage(sid: string, text: string, ts = Date.now()) {
  const key = kManager(sid)
  const list = (await kvGet<ManagerMsg[]>(key)) ?? []
  const last = list[list.length - 1]
  const updateId = Math.max(Date.now(), (last?.updateId ?? 0) + 1)
  list.push({ text, ts, updateId })
  await kvSet(key, list.slice(-50))
  await appendLog(sid, 'manager', text, ts)
  await crmEventBySid(sid, { type: 'chat_out', text })
  await kvSetEx(kRead(sid), Date.now(), PRESENCE_TTL) // ответил — значит прочитал
}

export async function getMeta(sid: string) {
  const [readAt, mt, adminOn] = await kvMget<number | string>([kRead(sid), kMgrTyping(sid), K_ADMIN_ONLINE])
  return { readAt: Number(readAt) || 0, managerTyping: mt != null, managerOnline: adminOn != null }
}

export function isOnline(p: Presence, now = Date.now()) {
  return !p.gone && now - p.lastSeen < ONLINE_MS
}
export function isTyping(p: Presence, now = Date.now()) {
  return !p.gone && p.typingAt > 0 && now - p.typingAt < TYPING_MS
}
