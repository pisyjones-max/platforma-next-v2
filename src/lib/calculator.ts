export type CalcType = 'roofing' | 'gutter' | 'insulation' | 'screws' | 'siding'

export function getCalcType(slug: string, name: string, productTitle = ''): CalcType {
  const c = `${slug} ${name.toLowerCase()} ${productTitle.toLowerCase()}`
  if (/vodostok|водосто|gutter|жёлоб|желоб|труб/.test(c))       return 'gutter'
  if (/uteplitel|изоляц|утеплит|rockwool|isover|izolyats/.test(c)) return 'insulation'
  if (/samorez|саморез|крепёж|fastener|krepezh/.test(c))         return 'screws'
  if (/sayding|сайдинг|fasad|фасад|panel|панел/.test(c))         return 'siding'
  return 'roofing'
}

export interface CalcInputs {
  // roofing
  len?: number; wid?: number; slopes?: number
  // gutter
  perim?: number; gutterLen?: number
  // insulation
  areaInp?: number; layers?: number; packSize?: number
  // screws
  perM2?: number
  // siding
  wallH?: number; openings?: number
  // shared
  margin?: number
}

export function calcResult(type: CalcType, inputs: CalcInputs, variantSkuName = '', packQty = 1) {
  const margin = (inputs.margin ?? 10) / 100

  if (type === 'roofing') {
    const area = (inputs.len ?? 10) * (inputs.wid ?? 6) * (inputs.slopes ?? 2) * (1 + margin)
    const unitM2 = parseFloat((variantSkuName.match(/(\d+[.,]\d+)\s*м²/)?.[1] ?? '').replace(',', '.')) || 0.9
    return { area, qty: Math.ceil(area / unitM2), unit: 'м²', qtyLabel: 'шт.' }
  }
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
  // siding
  const area = ((inputs.wallH ?? 3) * (inputs.perim ?? 40) - (inputs.openings ?? 15)) * (1 + margin)
  const panelM2 = parseFloat((variantSkuName.match(/(\d+[.,]\d+)\s*м²/)?.[1] ?? '').replace(',', '.')) || 0.72
  return { area, qty: Math.ceil(area / panelM2), unit: 'м²', qtyLabel: 'шт.' }
}
