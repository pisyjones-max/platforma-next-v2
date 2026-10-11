// Мини-метрика: счётчики по дням в Upstash Redis (HINCRBY / PFADD), всё в одном pipeline-запросе.
// Ключи: m:<YYYY-MM-DD по Москве>:<имя>. Имена: tot, src, ref, pages, entry, exit, flow, dev, ret, utm, goals, uv.
import { kvPipeline } from './kv'

export const M_HASHES = ['tot', 'src', 'ref', 'pages', 'entry', 'exit', 'flow', 'dev', 'ret', 'utm', 'goals'] as const
export const mDay = (ts = Date.now()) => new Date(ts + 3 * 3600_000).toISOString().slice(0, 10)
export const mKey = (d: string, name: string) => `m:${d}:${name}`

export function cleanPath(p: unknown): string {
  let s = String(p ?? '').split('#')[0].split('?')[0].replace(/[\u0000-\u001f]/g, '').slice(0, 120)
  if (!s.startsWith('/')) s = '/' + s
  return s || '/'
}

export function cleanHost(h: unknown): string {
  return String(h ?? '').toLowerCase().replace(/^www\./, '').replace(/[^a-z0-9.\-а-яё]/gi, '').slice(0, 80)
}

const SEARCH = /(^|\.)(yandex\.[a-z]+|ya\.ru|google\.[a-z.]+|bing\.com|duckduckgo\.com|go\.mail\.ru|rambler\.ru|yahoo\.com|search\.brave\.com)$/
const SOCIAL = /(^|\.)(vk\.com|vk\.ru|t\.me|telegram\.org|ok\.ru|facebook\.com|instagram\.com|youtube\.com|dzen\.ru|max\.ru|whatsapp\.com)$/
const MARKET = /(^|\.)(avito\.ru|ozon\.ru|wildberries\.ru|market\.yandex\.ru)$/

export interface Utm { s?: string | null; m?: string | null; c?: string | null; y?: number }

export function classifySource(refHost: string, selfHost: string, utm?: Utm): string {
  if (utm && (utm.s || utm.y)) return 'Реклама / метки'
  if (!refHost || refHost === cleanHost(selfHost)) return 'Прямые заходы'
  if (MARKET.test(refHost)) return 'Маркетплейсы'
  if (SEARCH.test(refHost)) return 'Поисковые системы'
  if (SOCIAL.test(refHost)) return 'Соцсети и мессенджеры'
  return 'Другие сайты'
}

export function deviceOf(ua: string): string {
  if (/iPad|Tablet/i.test(ua)) return 'Планшет'
  if (/Mobile|Android|iPhone/i.test(ua)) return 'Телефон'
  return 'Компьютер'
}

export const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|python-requests|curl|wget|Yandex(Metrika|Images|Direct|Turbo)|Google-|monitor|uptime/i

// Цель (заказ, заявка, карта, сообщение в чат) — считаем на сервере, блокировщики рекламы не мешают
export async function bumpGoal(name: string): Promise<void> {
  try { await kvPipeline([['HINCRBY', mKey(mDay(), 'goals'), name, 1]]) } catch {}
}
