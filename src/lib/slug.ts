/**
 * Транслитерация кириллицы в латиницу для очистки "грязных" id из парсера.
 * Парсер (scripts/parser.py) иногда тянет название товара с mk4s.ru как есть,
 * без очистки — в id могут просочиться пробелы, хвостовые пробелы, а иногда
 * и целые кириллические слова (например цвет/материал), либо кириллические
 * омоглифы (русская "с" вместо латинской "c").
 * Без этой очистки такие id давали в sitemap.xml сырой URL с пробелом/кириллицей,
 * который браузер/бот percent-encode'ил иначе, чем ожидал findProductBySlug —
 * и товар не находился (честный 404 на живой странице).
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 'c', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

/**
 * Приводит произвольный сегмент к безопасному URL-slug:
 * обрезает пробелы по краям, транслитерирует кириллицу, схлопывает
 * все не-[a-z0-9] символы в дефис.
 */
function slugify(raw: string): string {
  const lower = raw.trim().toLowerCase()
  const translit = lower.replace(/[а-яё]/g, (ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
  return translit
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Генерирует URL-slug товара из его id.
 * Используется и в sitemap.ts и в поиске товара по URL.
 * id пример: "plastikovye--soedinitel-zheloba" или "krovlya--myagkaya-krovlya--tehnonikol--rufmast-kvadro"
 */
export function productSlug(id: string): string {
  const parts = id.split('--')
  // Берём последние 2 сегмента чтобы избежать коллизий между категориями
  const raw = parts.length >= 2 ? parts.slice(-2).join('-') : parts[0]
  return slugify(raw)
}

/**
 * Ищет товар в категории по productId из URL.
 * Сравнение через slugify() на обеих сторонах — так что даже если где-то
 * ещё остался старый индексированный URL с сырым пробелом/кириллицей,
 * после percent-decode он всё равно нормализуется в тот же чистый slug.
 */
export function findProductBySlug<T extends { id: string }>(products: T[], productId: string): T | undefined {
  const wanted = slugify(productId)
  return products.find(p =>
    productSlug(p.id) === wanted ||
    p.id.split('--').pop()?.trim() === productId ||  // обратная совместимость со старыми URL
    p.id === productId
  )
}
