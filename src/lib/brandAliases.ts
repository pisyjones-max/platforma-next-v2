import type { Product } from '@/types/catalog'

/**
 * Нормализация значений features['Производитель'].
 *
 * Парсер тянул карточки с разных страниц mk4s.ru, поэтому один и тот же
 * бренд встречается под разными написаниями: другой регистр, кириллица
 * вместо латиницы (транслитерация), лишние пробелы, диакритика (ö/o).
 *
 * Здесь перечислены только подтверждённые дубликаты одного и того же
 * бренда, а не разные суб-линейки продуктов (например, "Технониколь
 * Shinglas" — это отдельная линейка Технониколь, а не опечатка, поэтому
 * сознательно не объединяется с "Технониколь").
 */
const RAW_TO_CANONICAL: [raw: string, canonical: string][] = [
  ['Docke', 'Docke'],
  ['Döcke', 'Docke'],

  ['Grand Line', 'Grand Line'],
  ['Grand line', 'Grand Line'],
  ['Гранд лайн', 'Grand Line'],

  ['ISOVER', 'ISOVER'],
  ['Isover', 'ISOVER'],

  ['LumiEste', 'LumiEste'],
  ['Lumi Este', 'LumiEste'],

  ['Icopal', 'Icopal'],
  ['Икопал', 'Icopal'],

  ['Tegola', 'Tegola'],
  ['Тегола', 'Tegola'],

  ['Interprofil', 'Interprofil'],
  ['Интерпрофиль', 'Interprofil'],

  // Внимание: "Ондулин" транслитерируется как "Ondulin", а не "Onduline" —
  // это разные написания одного бренда, "Onduline" в данных не путать с ним.
  ['Ondulin', 'Ondulin'],
  ['Ондулин', 'Ondulin'],
]

function foldKey(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // диакритика (ö -> o, é -> e и т.п.)
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]/g, '') // убираем пробелы/пунктуацию для устойчивого сравнения
}

const ALIAS_LOOKUP: Map<string, string> = new Map(
  RAW_TO_CANONICAL.map(([raw, canonical]) => [foldKey(raw), canonical])
)

/**
 * Приводит "сырое" значение производителя к каноническому имени бренда.
 * Если бренд не встречается в словаре синонимов — возвращает исходное
 * значение (обрезанное по краям), т.е. по умолчанию считается каноничным.
 */
export function normalizeBrand(raw: string | undefined | null): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const key = foldKey(trimmed)
  return ALIAS_LOOKUP.get(key) ?? trimmed
}

export interface BrandFacet {
  name: string
  count: number
}

/**
 * Считает количество товаров по каждому (нормализованному) бренду
 * в переданном списке товаров — используется, чтобы посчитать бренды
 * ТОЛЬКО в текущей категории, а не по всему каталогу.
 */
export function getBrandFacets(products: Product[]): BrandFacet[] {
  const counts = new Map<string, number>()
  for (const p of products) {
    const brand = normalizeBrand(p.features?.['Производитель'])
    if (!brand) continue
    counts.set(brand, (counts.get(brand) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ru'))
}
