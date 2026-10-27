'use client'
import { useState } from 'react'
import { getCalcType, type CalcType } from '@/lib/calculator'
import type { Product } from '@/types/catalog'
import { SidingCalculator } from './SidingCalculator'
import { RoofCalculator } from './RoofCalculator'
import { GutterCalculator } from './GutterCalculator'
import { InsulationCalculator } from './InsulationCalculator'
import { ScrewsCalculator } from './ScrewsCalculator'
import { SheetCalculator } from './SheetCalculator'
import { LiquidCalculator } from './LiquidCalculator'
import { FenceCalculator } from './FenceCalculator'
import { DeckCalculator } from './DeckCalculator'

interface Props { groupSlug?: string; catSlug: string; catName: string; product?: Product }

const TITLES: Record<Exclude<CalcType, null>, string> = {
  roofing: '🏗️ Калькулятор кровли',
  gutter: '🌧️ Калькулятор водостока',
  insulation: '🧱 Калькулятор утеплителя',
  screws: '🔩 Калькулятор саморезов',
  siding: '🏠 Калькулятор фасада',
  sheet: '📐 Калькулятор листов',
  liquid: '🧴 Калькулятор расхода',
  fence: '🧱 Калькулятор забора',
  deck: '🪵 Калькулятор террасы',
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
          {type === 'siding' && <SidingCalculator product={product} catSlug={catSlug} />}
          {type === 'roofing' && <RoofCalculator product={product} catSlug={catSlug} />}
          {type === 'gutter' && <GutterCalculator product={product} catSlug={catSlug} />}
          {type === 'insulation' && <InsulationCalculator product={product} />}
          {type === 'screws' && <ScrewsCalculator product={product} />}
          {type === 'sheet' && <SheetCalculator product={product} />}
          {type === 'fence' && <FenceCalculator product={product} catSlug={catSlug} />}
          {type === 'deck' && <DeckCalculator product={product} />}
          {type === 'liquid' && <LiquidCalculator product={product} catSlug={catSlug} />}
        </div>
      )}
    </div>
  )
}
