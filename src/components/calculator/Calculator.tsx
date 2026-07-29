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
// см. lib/calculator.ts для формул и BOM.
export function Calculator({ groupSlug = '', catSlug, catName, product }: Props) {
  const type = getCalcType(groupSlug, catSlug, catName, product?.title ?? '')
  const [open, setOpen] = useState(false)

  if (!type) return null

  return (
    <div className="mb-6 rounded-2xl border border-gray-800 bg-[var(--panel)] overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-white/5 transition-colors">
        <span>{TITLES[type]}</span>
        <span className="text-[var(--muted)]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
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
