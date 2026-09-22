// Отдельный процесс pm2: получает ответы менеджера из Telegram через getUpdates (не webhook).
// Нужен из-за того, что входящие соединения от серверов Telegram до этого VDS не проходят
// ("Connection timed out" в getWebhookInfo), хотя исходящие запросы (через ретранслятор,
// см. TG_API_BASE/TG_RELAY_KEY) работают нормально. getUpdates — это тоже исходящий запрос
// с сервера наружу, поэтому идёт тем же путём, что и отправка сообщений.
const fs = require('fs')
const path = require('path')

const ENV_PATH = path.join(__dirname, '..', '.env.local')
function loadEnv() {
  const env = {}
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return env
}

const env = loadEnv()
const TG_TOKEN = env.TG_TOKEN || ''
const TG_API_BASE = (env.TG_API_BASE || 'https://api.telegram.org').replace(/\/+$/, '')
const TG_RELAY_KEY = env.TG_RELAY_KEY || ''
const KV_URL = (env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || '').replace(/\/+$/, '')
const KV_TOKEN = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || ''
const OFFSET_FILE = path.join(__dirname, '..', '.tg-poller-offset')

if (!TG_TOKEN) { console.error('[tg-poller] TG_TOKEN не задан, выхожу'); process.exit(1) }
if (!KV_URL || !KV_TOKEN) { console.error('[tg-poller] KV не настроен, выхожу'); process.exit(1) }

function tgUrl(method) { return `${TG_API_BASE}/bot${TG_TOKEN}/${method}` }
function relayHeaders(extra) { return TG_RELAY_KEY ? { ...extra, 'x-relay-key': TG_RELAY_KEY } : extra }

async function kvFetch(p) {
  const res = await fetch(`${KV_URL}${p}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } })
  if (!res.ok) throw new Error(`KV ${res.status}`)
  return res.json()
}
async function kvGet(key) {
  const data = await kvFetch(`/get/${encodeURIComponent(key)}`)
  if (data?.result == null) return null
  try { return JSON.parse(data.result) } catch { return null }
}
async function kvSet(key, value) {
  const encoded = encodeURIComponent(JSON.stringify(value))
  await kvFetch(`/set/${encodeURIComponent(key)}/${encoded}`)
}

// Совпадает с логикой src/app/api/chat/webhook/route.ts — держать в синхроне при правках.
const sidFromReply = (t) => t.match(/Сессия:\s*`?([a-z0-9]+)`?/i)?.[1]?.toLowerCase() ?? null

async function handleUpdate(upd) {
  const msg = upd.message || upd.channel_post
  const text = msg?.text
  if (!text) return
  let session = null
  let body = text.trim()
  const replyTo = msg.reply_to_message?.text
  if (replyTo) session = sidFromReply(replyTo)
  if (!session) {
    const m = text.match(/^\/reply\s+([a-z0-9]+)\s+([\s\S]+)/i) || text.match(/^([a-z0-9]+):\s*([\s\S]+)/i)
    if (m) { session = m[1].toLowerCase(); body = m[2].trim() }
  }
  if (!session) return
  const key = `chat:${session}`
  const list = (await kvGet(key)) ?? []
  list.push({ text: body, ts: msg.date * 1000, updateId: upd.update_id })
  await kvSet(key, list.slice(-50))
  console.log(`[tg-poller] сообщение записано: session=${session} updateId=${upd.update_id}`)
}

function readOffset() {
  try { return parseInt(fs.readFileSync(OFFSET_FILE, 'utf8').trim()) || 0 } catch { return 0 }
}
function writeOffset(v) { try { fs.writeFileSync(OFFSET_FILE, String(v)) } catch {} }

async function tick(offset) {
  const res = await fetch(tgUrl('getUpdates'), {
    method: 'POST',
    headers: relayHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ offset, timeout: 25, allowed_updates: ['message', 'channel_post'] }),
    signal: AbortSignal.timeout(35000),
  })
  const data = await res.json()
  if (!data.ok) { console.error('[tg-poller] getUpdates error:', JSON.stringify(data).slice(0, 300)); return offset }
  for (const upd of data.result || []) {
    try { await handleUpdate(upd) } catch (e) { console.error('[tg-poller] handleUpdate error:', e) }
    offset = upd.update_id + 1
  }
  return offset
}

async function main() {
  // Снимаем webhook: getUpdates и webhook несовместимы (Telegram отвечает 409 при webhook активном).
  try {
    const r = await fetch(tgUrl('deleteWebhook'), {
      method: 'POST', headers: relayHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ drop_pending_updates: false }), signal: AbortSignal.timeout(10000),
    })
    console.log('[tg-poller] deleteWebhook:', JSON.stringify(await r.json()))
  } catch (e) { console.error('[tg-poller] deleteWebhook failed:', e) }

  let offset = readOffset()
  console.log('[tg-poller] старт, offset =', offset)
  for (;;) {
    try {
      const next = await tick(offset)
      if (next !== offset) { offset = next; writeOffset(offset) }
    } catch (e) {
      console.error('[tg-poller] tick error:', e?.message || e)
      await new Promise(r => setTimeout(r, 5000))
    }
  }
}

main()
