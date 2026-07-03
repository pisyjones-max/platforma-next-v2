// Тонкая обёртка над Upstash Redis REST API (подключается через Vercel Marketplace → Upstash for Redis).
// В зависимости от версии интеграции Vercel/Upstash подставляет либо KV_REST_API_URL/KV_REST_API_TOKEN,
// либо UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN — поддерживаем оба варианта.
const KV_URL   = process.env.KV_REST_API_URL   ?? process.env.UPSTASH_REDIS_REST_URL   ?? ''
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''

async function kvFetch(path: string): Promise<any> {
  if (!KV_URL || !KV_TOKEN) throw new Error('KV is not configured (KV_REST_API_URL / KV_REST_API_TOKEN missing)')
  const res = await fetch(`${KV_URL}${path}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`KV request failed: ${res.status}`)
  return res.json()
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const encoded = encodeURIComponent(JSON.stringify(value))
  await kvFetch(`/set/${encodeURIComponent(key)}/${encoded}`)
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const data = await kvFetch(`/get/${encodeURIComponent(key)}`)
  if (data?.result == null) return null
  try {
    return JSON.parse(data.result) as T
  } catch {
    return null
  }
}

export async function kvDel(key: string): Promise<void> {
  await kvFetch(`/del/${encodeURIComponent(key)}`)
}

// Возвращает все ключи по префиксу (например "card:") через SCAN — постранично, курсором.
export async function kvScanKeys(matchPattern: string): Promise<string[]> {
  const keys: string[] = []
  let cursor = '0'
  do {
    const data = await kvFetch(`/scan/${cursor}/match/${encodeURIComponent(matchPattern)}/count/100`)
    const [nextCursor, batch] = data?.result ?? ['0', []]
    cursor = nextCursor
    if (Array.isArray(batch)) keys.push(...batch)
  } while (cursor !== '0')
  return keys
}

export function isKvConfigured(): boolean {
  return Boolean(KV_URL && KV_TOKEN)
}
