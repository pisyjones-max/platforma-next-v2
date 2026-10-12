'use client'
import { useState } from 'react'
import Link from 'next/link'

export interface BrandChipItem {
  name: string
  count: number
  active: boolean
  /** для серверных страниц (поиск) — ссылка; без неё рисуется кнопка */
  href?: string
}

interface Props {
  items: BrandChipItem[]
  onToggle?: (name: string) => void
  onClear?: () => void
  clearHref?: string
}

const COLLAPSED = 12

// Плашки брендов сверху: «Все» + бренды со счётчиками. Мультивыбор.
// Если брендов много — первые 12 и кнопка «Ещё N». Выбранные всегда видны.
export function BrandChips({ items, onToggle, onClear, clearHref }: Props) {
  const [open, setOpen] = useState(false)
  if (items.length < 2) return null

  const anyActive = items.some(i => i.active)
  const visible = open || items.length <= COLLAPSED
    ? items
    : items.filter((i, idx) => idx < COLLAPSED || i.active)
  const hidden = items.length - visible.length

  return (
    <div className="bchips" role="group" aria-label="Фильтр по бренду">
      {clearHref
        ? <Link href={clearHref} scroll={false} className={`bchip ${anyActive ? '' : 'active'}`}>Все</Link>
        : <button type="button" className={`bchip ${anyActive ? '' : 'active'}`} onClick={onClear}>Все</button>}
      {visible.map(i => {
        const cls = `bchip ${i.active ? 'active' : ''}`
        const inner = <>{i.name}<span className="bchip-n">{i.count}</span></>
        return i.href
          ? <Link key={i.name} href={i.href} scroll={false} className={cls}>{inner}</Link>
          : <button key={i.name} type="button" className={cls} onClick={() => onToggle?.(i.name)}>{inner}</button>
      })}
      {hidden > 0 && (
        <button type="button" className="bchip bchip-more" onClick={() => setOpen(true)}>Ещё {hidden}</button>
      )}
      {open && items.length > COLLAPSED && (
        <button type="button" className="bchip bchip-more" onClick={() => setOpen(false)}>Свернуть</button>
      )}
    </div>
  )
}
