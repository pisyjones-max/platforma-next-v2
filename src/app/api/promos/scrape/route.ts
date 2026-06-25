import { NextRequest, NextResponse } from 'next/server'
import { TG_TOKEN, TG_CHAT_ID } from '@/lib/constants'

// Vercel Cron: runs daily at 09:00 Moscow time (06:00 UTC)
// Add to vercel.json: { "crons": [{ "path": "/api/promos/scrape", "schedule": "0 6 * * *" }] }

const SOURCES = [
  {
    brand: 'deke',
    name: 'Деке',
    url: 'https://docke.ru/news/',
    keywords: ['акция', 'скидка', 'распродажа', 'специальн', 'предложен'],
  },
  {
    brand: 'grandline',
    name: 'Гранд Лайн',
    url: 'https://www.grandline.ru/akczii/',
    keywords: ['акция', 'скидка', 'распродажа', 'специальн', 'предложен'],
  },
  {
    brand: 'technonicol',
    name: 'ТехноНИКОЛЬ',
    url: 'https://www.technonicol.ru/about/news/',
    keywords: ['акция', 'скидка', 'распродажа', 'специальн', 'предложен'],
  },
]

async function checkSite(source: typeof SOURCES[0]): Promise<{ found: boolean; snippet?: string }> {
  try {
    const res = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PLATFORMA-bot/1.0)',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return { found: false }

    const html = await res.text()
    const lower = html.toLowerCase()

    const found = source.keywords.some(kw => lower.includes(kw))

    if (found) {
      // Extract title snippet near keyword
      const idx = source.keywords.reduce((best, kw) => {
        const i = lower.indexOf(kw)
        return i !== -1 && (best === -1 || i < best) ? i : best
      }, -1)

      const snippet = html
        .slice(Math.max(0, idx - 50), idx + 200)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 150)

      return { found: true, snippet }
    }

    return { found: false }
  } catch (e) {
    console.error(`[SCRAPER] ${source.brand} error:`, e)
    return { found: false }
  }
}

export async function GET(req: NextRequest) {
  // Allow manual trigger or cron
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  for (const source of SOURCES) {
    const { found, snippet } = await checkSite(source)
    if (found) {
      results.push(`✅ *${source.name}*: найдены акционные материалы\n_${snippet}_\n🔗 ${source.url}`)
    } else {
      results.push(`⬜ *${source.name}*: акций не обнаружено`)
    }
  }

  // Notify manager in Telegram
  if (TG_TOKEN && TG_CHAT_ID) {
    const text =
      `🔍 *Мониторинг акций производителей*\n` +
      `📅 ${new Date().toLocaleString('ru-RU')}\n\n` +
      results.join('\n\n')

    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'Markdown' }),
    }).catch(console.error)
  }

  return NextResponse.json({ ok: true, checked: SOURCES.length, results })
}
