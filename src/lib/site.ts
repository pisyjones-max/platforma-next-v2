// Единый источник правды для домена сайта
// Меняй только здесь — sitemap.ts и robots.ts подтянут автоматически
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  ?? 'https://platforma-pro.vercel.app'
