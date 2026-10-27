'use client'
import Link from 'next/link'
import type { BomItem } from '@/lib/calculator'

// Список позиций расчёта. У комплектующих есть ссылка «подобрать» в каталог:
// либо явная (item.href), либо общая accessoriesHref для всех строк после основной.
export function CalcBom({ bom, accessoriesHref }: { bom: BomItem[]; accessoriesHref?: string }) {
  return (
    <div className="calcw-bom">
      {bom.map((b, i) => {
        const href = b.href ?? (i > 0 ? accessoriesHref : undefined)
        return (
          <div key={i} className="calcw-bom-row">
            <span>
              {b.label}
              {href && (
                <>
                  {' '}
                  <Link href={href} className="calcw-add-link" style={{ fontSize: 12 }}>подобрать →</Link>
                </>
              )}
            </span>
            <strong>{b.qty} {b.unit}</strong>
          </div>
        )
      })}
    </div>
  )
}
