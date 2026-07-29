'use client'
import { useState } from 'react'
import { getCalcType, type CalcType } from '@/lib/calculator'
import type { Product } from '@/types/catalog'
import { SidingCalculator } from './SidingCalculator'
import { RoofCalculator } from './RoofCalculator'
import { GutterCalculator } from './GutterCalculator'
import { InsulationCalculator } from './InsulationCalculator'
import { ScrewsCalculator } from './ScrewsCalculator'
import { CALC_HEADFONT } from './CalcRowList'

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
    <div className="mb-5 overflow-hidden rounded-[var(--rl)] border border-[var(--border)] bg-[var(--surface)]">
      <button
        onClick={() => setOpen(o => !o)}
        style={CALC_HEADFONT}
        className="flex w-full items-center gap-2 px-[18px] py-[14px] text-left text-[13px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface2)]"
      >
        <span>{TITLES[type]}</span>
        <span className="ml-auto text-[var(--muted)]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-[var(--border)] px-[18px] py-4">
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
