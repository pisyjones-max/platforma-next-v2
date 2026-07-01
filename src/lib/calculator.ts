// CalcType = null означает "калькулятор не нужен для этой категории"
export type CalcType = 'roofing' | 'gutter' | 'insulation' | 'screws' | 'siding' | null

// Категории где калькулятор ТОЧНО НЕ НУЖЕН:
// - Лестницы (чердачные) — штучный товар, выбирается по размеру люка
// - Окна мансардные — штучный товар
// - Дымоходы — штучный, подбор по диаметру
// - Химия (герметики, антисептики, клей) — жидкости/банки, считают литрами вручную
// - Сухие смеси — мешки, штучно
// - Вентиляция — штучные элементы
// - Снегозадержатели — штучный монтаж
// - Безопасность кровли (лестницы, ограждения) — штучно
// - Козырьки — штучно
// - Благоустройство — разнородные товары
// - Флюгеры, кабель, герметики (комплектация кровли)
// - Дренаж — штучные лотки
// - Напольные покрытия — отдельная логика (есть своя формула, но пока не делаем)

const NO_CALC_SLUGS = new Set([
  'cherdachnye-lestnitsy',
  'mansardnye-okna',
  'dymohody',
  'himiya',
  'suhie-smesi',
  'ventilyatsiya-krovli',
  'snegozaderzhateli',
  'bezopasnost-krovli',
  'kozyrek-iz-polikarbonata',
  'blagoustroystvo',
  'krovli',           // комплектация: флюгеры, кабель, герметики
  'drenazh',
  'floor',
  'krepezh',          // крепёж — лучше перестраховаться, там упаковки с фиксированным кол-вом
])

export function getCalcType(groupSlug: string, slug: string, name: string, productTitle = ''): CalcType {
  // Проверяем slug ГРУППЫ (не категории!) — именно группы перечислены в NO_CALC_SLUGS
  for (const noSlug of NO_CALC_SLUGS) {
    if (groupSlug.includes(noSlug)) return null
  }

  const c = `${slug} ${name.toLowerCase()} ${productTitle.toLowerCase()}`

  if (/vodostok|водосто|gutter|жёлоб|желоб/.test(c))              return 'gutter'
  if (/uteplitel|изоляц|утеплит|rockwool|isover|izolyats/.test(c)) return 'insulation'
  if (/samorez|саморез/.test(c))                                   return 'screws'
  if (/sayding|сайдинг|fasad|фасад|panel|панел|planken|планкен/.test(c)) return 'siding'

  // Кровля, заборы (профнастил, евроштакетник), террасная доска, плиты OSB — считаем по площади
  if (/krovl|кровл|profnastil|профнаст|shtaketnik|штакетн|terrasnay|терраcн|doska-dpk|plita|плита|osb|osp/.test(c)) return 'roofing'

  // По умолчанию — roofing (площадь), лучше чем ничего
  return 'roofing'
}

export interface CalcInputs {
  len?: number; wid?: number; slopes?: number
  perim?: number; gutterLen?: number
  areaInp?: number; layers?: number; packSize?: number
  perM2?: number
  wallH?: number; openings?: number
  margin?: number
}

export function calcResult(type: CalcType, inputs: CalcInputs, variantSkuName = '', packQty = 1) {
  const margin = (inputs.margin ?? 10) / 100

  if (type === 'gutter') {
    const area = (inputs.perim ?? 40) * (1 + margin)
    const qty = Math.ceil(area / (inputs.gutterLen ?? 3))
    return { area, qty, unit: 'м', qtyLabel: 'шт.' }
  }
  if (type === 'insulation') {
    const area = (inputs.areaInp ?? 60) * (inputs.layers ?? 1) * (1 + margin)
    const plateM2 = parseFloat((variantSkuName.match(/(\d+[.,]\d+)\s*м²/)?.[1] ?? '').replace(',', '.')) || 0.48
    const packs = Math.ceil(Math.ceil(area / plateM2) / (inputs.packSize ?? packQty))
    return { area, qty: packs, unit: 'м²', qtyLabel: 'уп.' }
  }
  if (type === 'screws') {
    const total = (inputs.areaInp ?? 80) * (inputs.perM2 ?? 8)
    const qty = Math.ceil(total / (inputs.packSize ?? 250))
    return { area: total, qty, unit: 'шт.', qtyLabel: 'уп.' }
  }
  if (type === 'siding') {
    const area = ((inputs.wallH ?? 3) * (inputs.perim ?? 40) - (inputs.openings ?? 15)) * (1 + margin)
    const panelM2 = parseFloat((variantSkuName.match(/(\d+[.,]\d+)\s*м²/)?.[1] ?? '').replace(',', '.')) || 0.72
    return { area, qty: Math.ceil(area / panelM2), unit: 'м²', qtyLabel: 'шт.' }
  }
  // roofing (default)
  const area = (inputs.len ?? 10) * (inputs.wid ?? 6) * (inputs.slopes ?? 2) * (1 + margin)
  const unitM2 = parseFloat((variantSkuName.match(/(\d+[.,]\d+)\s*м²/)?.[1] ?? '').replace(',', '.')) || 0.9
  return { area, qty: Math.ceil(area / unitM2), unit: 'м²', qtyLabel: 'шт.' }
}
