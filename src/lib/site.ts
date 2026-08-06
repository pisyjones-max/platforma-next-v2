// Единый источник правды для домена сайта
// Меняй только здесь — sitemap.ts и robots.ts подтянут автоматически
// ВАЖНО: fallback указывает на боевой домен, а не на старый Vercel —
// если переменная окружения вдруг не прокинется при сборке, sitemap/robots
// всё равно сгенерируются с правильным доменом, а не молча уедут на мёртвый vercel.app
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  ?? 'https://platforma-msk.ru'
