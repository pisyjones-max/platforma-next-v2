'use client'
import { useState } from 'react'
import { getCalcType, type CalcType } from '@/lib/calculator'
import type { Product } from '@/types/catalog'
import { SidingCalculator } from './SidingCalculator'
import { RoofCalculator } from './RoofCalculator'
import { GutterCalculator } from './GutterCalculator'
import { InsulationCalculator } from './InsulationCalculator'
import { ScrewsCalculator } from './ScrewsCalculator'

interface Props { groupSlug?: string; catSlug: string; catName: string; product?: Product }

const TITLES: Record<Exclude<CalcType, null>, string> = {
  roofing: '🏗️ Калькулятор кровли',
  gutter: '🌧️ Калькулятор водостока',
  insulation: '🧱 Калькулятор утеплителя',
  screws: '🔩 Калькулятор саморезов',
  siding: '🏠 Калькулятор фасада',
}

// Calculator — тонкая обёртка-аккордеон. Вся логика расчёта и UI —
// в выделенных компонентах по каждому типу (Siding/Roof/Gutter/Insulation/Screws),
// см. lib/calculator.ts для формул и BOM. Стили — .calcw-* в globals.css.
export function Calculator({ groupSlug = '', catSlug, catName, product }: Props) {
  const type = getCalcType(groupSlug, catSlug, catName, product?.title ?? '')
  const [open, setOpen] = useState(false)

  if (!type) return null

  return (
    <div className="calcw-wrap">
      <button onClick={() => setOpen(o => !o)} className="calcw-toggle">
        <span>{TITLES[type]}</span>
        <span className="calcw-chev">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="calcw-body">
          {type === 'siding' && <SidingCalculator product={product} />}
          {type === 'roofing' && <RoofCalculator product={product} />}
          {type === 'gutter' && <GutterCalculator product={product} />}
          {type === 'insulation' && <InsulationCalculator product={product} />}
          {type === 'screws' && <ScrewsCalculator product={product} />}
        </div>
      )}
    </div>
  )
}
