// Картинки лежат в GitHub репо и раздаются через jsDelivr CDN
// Это позволяет деплоить на Vercel без 1.8GB в public/
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/pisyjones-max/platforma-next-v2@main/public'

export function imgUrl(src: string): string {
  if (!src) return ''
  // Уже полный URL — отдаём как есть
  if (src.startsWith('http')) return src
  // Абсолютный путь с / — проверяем начало
  if (src.startsWith('/images/')) return CDN_BASE + src
  // Относительный путь типа "images/xxx/xxx.jpg"
  if (src.startsWith('images/')) return CDN_BASE + '/' + src
  // Всё остальное
  return src.startsWith('/') ? src : '/' + src
}
