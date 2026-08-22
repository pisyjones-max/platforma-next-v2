import fs from 'node:fs'
import path from 'node:path'
import type { Catalog, Category, Product } from '@/types/catalog'

// ВАЖНО: раньше здесь было `import rawCatalog from '@/catalog.json'` — webpack
// вшивал каталог прямо в JS-бандл на этапе сборки. Из-за этого ЛЮБОЕ изменение
// в catalog.json (даже одна цена на один товар) требовало полного `npm run build`
// + перезапуск процесса на сервере, чтобы новые данные вообще появились на сайте —
// ночной парсер гонял весь этот конвейер каждую ночь просто чтобы обновить цены.
//
// Теперь каталог читается с диска в рантайме (файл лежит в public/catalog/catalog.json —
// он не участвует в сборке, просто статический файл рядом с приложением) и кэшируется
// в памяти процесса. Кэш инвалидируется по mtime файла: если файл на диске обновился,
// следующий вызов getCatalog() перечитает и распарсит его заново — без пересборки
// и без перезапуска pm2. См. .github/workflows/parse-catalog.yml — теперь при
// изменении только каталога (без изменений кода) файл просто докладывается на сервер
// поверх старого, и следующий запрос подхватывает свежие данные сам.
const CATALOG_PATH = path.join(process.cwd(), 'public', 'catalog', 'catalog.json')

let cached: Catalog | null = null
let cachedMtimeMs = 0

function loadCatalog(): Catalog {
  let stat: fs.Stats
  try {
    stat = fs.statSync(CATALOG_PATH)
  } catch (e) {
    if (cached) return cached // диск временно недоступен — отдаём то, что уже было в памяти
    throw new Error(`[catalog] Не найден ${CATALOG_PATH}: ${e}`)
  }

  if (cached && stat.mtimeMs === cachedMtimeMs) {
    return cached // файл не менялся с прошлого раза — лишний раз JSON.parse не гоняем
  }

  const raw = fs.readFileSync(CATALOG_PATH, 'utf-8')
  const parsed = JSON.parse(raw) as Catalog
  warnOnDuplicateCategorySlugs(parsed)

  cached = parsed
  cachedMtimeMs = stat.mtimeMs
  return parsed
}

// Защита от регресса: если у двух категорий совпадёт slug, findCategory()
// найдёт только первую, а все товары второй молча станут 404 (как это уже
// было с /catalog/fakro/... — там одновременно жили "Мансардные окна Fakro"
// и "Чердачная лестница Fakro" с одинаковым slug "fakro"). Проверяем это
// при каждой перезагрузке каталога и громко предупреждаем, если коллизия вернулась.
function warnOnDuplicateCategorySlugs(cat: Catalog) {
  const seen = new Map<string, string>()
  for (const c of cat.categories) {
    const prev = seen.get(c.slug)
    if (prev) {
      console.error(
        `[catalog] Дублирующийся slug категории "${c.slug}": "${prev}" и "${c.name}". ` +
        `Товары второй категории будут недоступны (404) — нужно задать уникальный slug.`
      )
    } else {
      seen.set(c.slug, c.name)
    }
  }
}

export function getCatalog(): Catalog {
  return loadCatalog()
}

export function findProduct(cat: Catalog, id: string): Product | undefined {
  for (const c of cat.categories) {
    const p = c.products.find(
      // .trim() — часть id из парсера содержит хвостовые пробелы (см. src/lib/slug.ts)
      p => p.id === id || p.id.split('--').pop()?.trim() === id
    )
    if (p) return p
  }
}

export function findCategory(cat: Catalog, slug: string): Category | undefined {
  return cat.categories.find(c => c.slug === slug)
}

export function getParentGroup(cat: Catalog, catSlug: string) {
  const entry = Object.entries(cat.groups).find(
    ([, g]) => g.categories.includes(catSlug)
  )
  return entry ? { slug: entry[0], group: entry[1] } : null
}

// ~19% товаров (917 из 4918 на момент диагностики) присутствуют сразу в
// нескольких категориях каталога (например, профнастил лежит и в
// "profnastil", и в "profnastil-dlya-zabora") — это следствие того, как
// парсер раскладывает товары по SUBCATEGORY_MAP на mk4s.ru. Каждая такая
// категория раньше рендерила ПОЛНОСТЬЮ идентичную карточку товара по
// собственному URL с self-referencing canonical (canonical = сам на себя).
// Для Яндекса это чистый дубль контента: 21.08.2026 Вебмастер массово
// исключил 154 такие страницы с вердиктом "малоценная страница", потому что
// не мог понять, какая из копий главная.
//
// Решение: у каждого id товара считаем ЕДИНУЮ каноническую категорию и
// используем её в canonical на ВСЕХ дублирующих URL — сами страницы
// остаются доступны (это ок для навигации по каждой категории), но
// поисковику явно говорим, какая версия основная.
//
// Правило выбора канонической категории:
// 1. Если второй сегмент id (id вида "группа--категория--бренд--слаг")
//    совпадает с одной из категорий, где встречается товар — это и есть
//    исходная категория парсера, берём её (покрывает 797 из 917 случаев).
// 2. Иначе — берём первую категорию по порядку в catalog.json (стабильно,
//    т.к. порядок задаётся ночным парсером и не меняется хаотично).
let canonicalCategoryCache: Map<string, string> | null = null
let canonicalCategoryCacheMtimeMs = -1

function buildCanonicalCategoryMap(cat: Catalog): Map<string, string> {
  const idToSlugs = new Map<string, string[]>()
  for (const c of cat.categories) {
    for (const p of c.products) {
      const slugs = idToSlugs.get(p.id)
      if (slugs) slugs.push(c.slug)
      else idToSlugs.set(p.id, [c.slug])
    }
  }

  const result = new Map<string, string>()
  for (const [id, slugs] of idToSlugs) {
    if (slugs.length === 1) {
      result.set(id, slugs[0])
      continue
    }
    const idCategorySegment = id.split('--')[1]
    const canonical =
      idCategorySegment && slugs.includes(idCategorySegment) ? idCategorySegment : slugs[0]
    result.set(id, canonical)
  }
  return result
}

/**
 * Возвращает slug единственной "канонической" категории для товара —
 * используется для <link rel="canonical"> на странице товара, чтобы
 * задублированные по нескольким категориям товары не считались поисковиком
 * дублями контента. См. комментарий выше.
 *
 * fallbackCatSlug используется только если товар почему-то не нашёлся в
 * карте (не должно происходить в норме) — тогда просто не меняем текущий URL.
 */
export function getCanonicalCategorySlug(
  cat: Catalog,
  product: Product,
  fallbackCatSlug: string
): string {
  if (!canonicalCategoryCache || canonicalCategoryCacheMtimeMs !== cachedMtimeMs) {
    canonicalCategoryCache = buildCanonicalCategoryMap(cat)
    canonicalCategoryCacheMtimeMs = cachedMtimeMs
  }
  return canonicalCategoryCache.get(product.id) ?? fallbackCatSlug
}
