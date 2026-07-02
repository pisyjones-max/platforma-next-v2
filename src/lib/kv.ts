// Тонкая обёртка над Vercel KV (Upstash Redis REST API).
// В Vercel: Storage → Create Database → KV — переменные окружения
// KV_REST_API_URL и KV_REST_API_TOKEN подставятся автоматически после подключения.
const KV_URL   = process.env.KV_REST_API_URL   ?? ''
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? ''

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

export function isKvConfigured(): boolean {
  return Boolean(KV_URL && KV_TOKEN)
}
