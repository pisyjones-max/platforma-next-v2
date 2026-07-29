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

// ─── Сайдинг: пообъектная модель дома (стены/проёмы/углы отдельно) ───
// Мировая практика (Döcke, James Hardie): считать не «периметр × высота»,
// а сумму реальных стен минус проёмы, плюс отдельные расходники по углам.
export interface WallItem { id: string; w: number; h: number }
export interface OpeningItem { id: string; w: number; h: number }
export interface CornerItem { id: string; h: number }

export interface SidingInputs {
  walls: WallItem[]
  openings: OpeningItem[]
  outerCorners: CornerItem[]
  innerCorners: CornerItem[]
  margin: number
}

export interface BomItem { label: string; qty: number; unit: string }

// Стандартная длина углового элемента и стартовой планки, м
export const SIDING_CORNER_LEN_M = 3
export const SIDING_STRIP_LEN_M = 3

export function calcSiding(inputs: SidingInputs, variantSkuName = '', _packQty = 1) {
  const margin = (inputs.margin ?? 10) / 100

  const grossWalls = inputs.walls.reduce((s, w) => s + Math.max(0, w.w) * Math.max(0, w.h), 0)
  const openingsArea = inputs.openings.reduce((s, o) => s + Math.max(0, o.w) * Math.max(0, o.h), 0)
  const netArea = Math.max(0, grossWalls - openingsArea) * (1 + margin)

  const panelM2 = parseFloat((variantSkuName.match(/(\d+[.,]\d+)\s*м²/)?.[1] ?? '').replace(',', '.')) || 0.72
  const panelsQty = Math.ceil(netArea / panelM2)

  const outerLen = inputs.outerCorners.reduce((s, c) => s + Math.max(0, c.h), 0)
  const innerLen = inputs.innerCorners.reduce((s, c) => s + Math.max(0, c.h), 0)
  const outerQty = outerLen > 0 ? Math.ceil(outerLen / SIDING_CORNER_LEN_M) : 0
  const innerQty = innerLen > 0 ? Math.ceil(innerLen / SIDING_CORNER_LEN_M) : 0

  // Стартовая планка идёт по низу каждой стены — берём сумму ширин стен
  const startPerim = inputs.walls.reduce((s, w) => s + Math.max(0, w.w), 0)
  const stripQty = startPerim > 0 ? Math.ceil(startPerim / SIDING_STRIP_LEN_M) : 0

  const bom: BomItem[] = [
    { label: 'Панели сайдинга', qty: panelsQty, unit: 'уп.' },
  ]
  if (outerQty > 0) bom.push({ label: 'Наружный угол', qty: outerQty, unit: 'шт.' })
  if (innerQty > 0) bom.push({ label: 'Внутренний угол', qty: innerQty, unit: 'шт.' })
  if (stripQty > 0) bom.push({ label: 'Стартовая планка', qty: stripQty, unit: 'шт.' })

  return { area: netArea, unit: 'м²', qty: panelsQty, qtyLabel: 'уп.', bom }
}

// ─── Кровля: несколько скатов + конёк/ендова/свесы отдельными позициями ───
// Мировая практика (Döcke calc-roof): площадь считается по каждому скату
// отдельно (т.к. скаты часто разного размера), плюс отдельные комплектующие
// по длине конька, ендовы, карнизных и фронтонных свесов.
export interface RoofSlopeItem { id: string; len: number; wid: number }

export interface RoofInputs {
  slopes: RoofSlopeItem[]
  ridgeLen: number   // длина конька, м
  eaveLen: number     // длина карнизных свесов, м
  vergeLen: number    // длина фронтонных (ветровых) свесов, м
  valleyLen: number   // длина ендовы, м
  margin: number
}

// Стандартная длина элемента конька / карнизной планки / ендовы, м
export const ROOF_RIDGE_ELEMENT_LEN_M = 2
export const ROOF_EAVE_STRIP_LEN_M = 2
export const ROOF_VALLEY_ELEMENT_LEN_M = 2

export function calcRoofDetailed(inputs: RoofInputs, variantSkuName = '', _packQty = 1) {
  const margin = (inputs.margin ?? 10) / 100

  const grossArea = inputs.slopes.reduce((s, sl) => s + Math.max(0, sl.len) * Math.max(0, sl.wid), 0)
  const area = grossArea * (1 + margin)

  const unitM2 = parseFloat((variantSkuName.match(/(\d+[.,]\d+)\s*м²/)?.[1] ?? '').replace(',', '.')) || 0.9
  const sheetsQty = Math.ceil(area / unitM2)

  const ridgeQty = inputs.ridgeLen > 0 ? Math.ceil(inputs.ridgeLen / ROOF_RIDGE_ELEMENT_LEN_M) : 0
  const eaveQty = inputs.eaveLen > 0 ? Math.ceil(inputs.eaveLen / ROOF_EAVE_STRIP_LEN_M) : 0
  const vergeQty = inputs.vergeLen > 0 ? Math.ceil(inputs.vergeLen / ROOF_EAVE_STRIP_LEN_M) : 0
  const valleyQty = inputs.valleyLen > 0 ? Math.ceil(inputs.valleyLen / ROOF_VALLEY_ELEMENT_LEN_M) : 0

  const bom: BomItem[] = [
    { label: 'Кровельный материал', qty: sheetsQty, unit: 'шт.' },
  ]
  if (ridgeQty > 0) bom.push({ label: 'Коньковый элемент', qty: ridgeQty, unit: 'шт.' })
  if (eaveQty > 0) bom.push({ label: 'Карнизная планка', qty: eaveQty, unit: 'шт.' })
  if (vergeQty > 0) bom.push({ label: 'Ветровая (фронтонная) планка', qty: vergeQty, unit: 'шт.' })
  if (valleyQty > 0) bom.push({ label: 'Ендова', qty: valleyQty, unit: 'шт.' })

  return { area, unit: 'м²', qty: sheetsQty, qtyLabel: 'шт.', bom }
}

// ─── Водосток: желоба отдельными участками + углы/воронки/трубы/колена ───
// Мировая практика (Döcke calc-drainpipes): помимо погонажа жёлоба считают
// отдельно углы (наружный/внутренний), воронки, водосточные трубы (по высоте
// стены) и колена для отвода трубы от стены.
export interface GutterRunItem { id: string; len: number }

export interface GutterInputs {
  runs: GutterRunItem[]
  outerCorners: number
  innerCorners: number
  funnels: number       // воронки
  wallHeight: number     // высота стены — для расчёта длины трубы
  elbowsPerFunnel: number // колен на одну воронку (обычно 2: у карниза и у отмостки)
  margin: number
}

// Стандартная длина желоба и трубы, м
export const GUTTER_ELEMENT_LEN_M = 3
export const PIPE_ELEMENT_LEN_M = 3

export function calcGutterDetailed(inputs: GutterInputs, variantSkuName = '', _packQty = 1) {
  const margin = (inputs.margin ?? 10) / 100

  const totalLen = inputs.runs.reduce((s, r) => s + Math.max(0, r.len), 0)
  const lenWithMargin = totalLen * (1 + margin)

  const gutterElLen = parseFloat((variantSkuName.match(/(\d+[.,]\d+)\s*м/)?.[1] ?? '').replace(',', '.')) || GUTTER_ELEMENT_LEN_M
  const gutterQty = Math.ceil(lenWithMargin / gutterElLen)

  const pipeLen = Math.max(0, inputs.wallHeight) * Math.max(0, inputs.funnels)
  const pipeQty = pipeLen > 0 ? Math.ceil(pipeLen / PIPE_ELEMENT_LEN_M) : 0
  const elbowsQty = Math.max(0, inputs.funnels) * Math.max(0, inputs.elbowsPerFunnel)

  const bom: BomItem[] = [
    { label: 'Желоб водосточный', qty: gutterQty, unit: 'шт.' },
  ]
  if (inputs.outerCorners > 0) bom.push({ label: 'Угол жёлоба наружный', qty: Math.round(inputs.outerCorners), unit: 'шт.' })
  if (inputs.innerCorners > 0) bom.push({ label: 'Угол жёлоба внутренний', qty: Math.round(inputs.innerCorners), unit: 'шт.' })
  if (inputs.funnels > 0) bom.push({ label: 'Воронка', qty: Math.round(inputs.funnels), unit: 'шт.' })
  if (pipeQty > 0) bom.push({ label: 'Труба водосточная', qty: pipeQty, unit: 'шт.' })
  if (elbowsQty > 0) bom.push({ label: 'Колено', qty: Math.round(elbowsQty), unit: 'шт.' })

  return { area: lenWithMargin, unit: 'м', qty: gutterQty, qtyLabel: 'шт.', bom }
}

// ─── Утеплитель: отдельные зоны конструкций со своим числом слоёв ───
// У стен, кровли и пола обычно разная толщина утепления (разное число слоёв
// плит), поэтому считаем каждую зону отдельно, а не одной общей площадью.
export interface InsulationZoneItem { id: string; label: string; area: number; layers: number }

export interface InsulationInputs {
  zones: InsulationZoneItem[]
  packSize: number
  margin: number
}

export function calcInsulationDetailed(inputs: InsulationInputs, variantSkuName = '', packQty = 1) {
  const margin = (inputs.margin ?? 10) / 100
  const plateM2 = parseFloat((variantSkuName.match(/(\d+[.,]\d+)\s*м²/)?.[1] ?? '').replace(',', '.')) || 0.48
  const packSize = inputs.packSize || packQty || 1

  let totalArea = 0
  const bom: BomItem[] = []
  for (const z of inputs.zones) {
    const zoneArea = Math.max(0, z.area) * Math.max(1, z.layers) * (1 + margin)
    totalArea += zoneArea
    if (zoneArea > 0) {
      const zonePacks = Math.ceil(Math.ceil(zoneArea / plateM2) / packSize)
      bom.push({ label: `${z.label} (${Math.max(1, z.layers)} сл.)`, qty: zonePacks, unit: 'уп.' })
    }
  }

  const totalPacks = Math.ceil(Math.ceil(totalArea / plateM2) / packSize)

  return { area: totalArea, unit: 'м²', qty: totalPacks, qtyLabel: 'уп.', bom }
}

// ─── Саморезы: расход привязан к типу материала, а не вводится вслепую ───
// Раньше пользователь должен был сам знать норму «шт/м²» — большинство
// не знает и ставит наугад. Теперь выбирается материал, и норма подставляется
// автоматически (с возможностью переопределить вручную через «Свой расход»).
export interface ScrewPreset { id: string; label: string; perM2: number }

export const SCREW_PRESETS: ScrewPreset[] = [
  { id: 'profnastil',       label: 'Профнастил (кровля/забор)',   perM2: 7 },
  { id: 'metallocherepica', label: 'Металлочерепица',              perM2: 8 },
  { id: 'sandwich',         label: 'Сэндвич-панели',                perM2: 6 },
  { id: 'siding',           label: 'Сайдинг / фасадные панели',    perM2: 8 },
  { id: 'osb',              label: 'OSB / половая плита',           perM2: 15 },
  { id: 'custom',           label: 'Свой расход (указать вручную)', perM2: 8 },
]

export interface ScrewsInputs {
  area: number
  materialId: string
  customPerM2: number
  packSize: number
}

export function calcScrewsDetailed(inputs: ScrewsInputs, packQty = 1) {
  const preset = SCREW_PRESETS.find(p => p.id === inputs.materialId)
  const perM2 = inputs.materialId === 'custom' ? Math.max(0, inputs.customPerM2) : (preset?.perM2 ?? Math.max(0, inputs.customPerM2))
  const total = Math.max(0, inputs.area) * perM2
  const packSize = inputs.packSize || packQty || 250
  const qty = Math.ceil(total / packSize)

  return {
    area: total,
    unit: 'шт.',
    qty,
    qtyLabel: 'уп.',
    perM2,
    bom: [{ label: preset?.label ?? 'Саморезы', qty, unit: 'уп.' }] as BomItem[],
  }
}
