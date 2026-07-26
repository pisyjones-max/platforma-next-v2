'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { imgUrl } from '@/lib/image'
import { fmt } from '@/lib/price'

interface Suggestion {
  id: string
  title: string
  salePrice: number
  img?: string
  href: string
}

export function SearchBox() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reqIdRef = useRef(0)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = value.trim()
    if (q.length < 2) {
      setSuggestions([])
      setTotal(0)
      return
    }
    const myReqId = ++reqIdRef.current
    debounceRef.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`)
        .then(r => (r.ok ? r.json() : null))
        .then((data: { results: Suggestion[]; total: number } | null) => {
          if (!data || myReqId !== reqIdRef.current) return
          setSuggestions(data.results)
          setTotal(data.total)
          setOpen(true)
        })
        .catch(() => {})
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  const goToResults = useCallback(() => {
    const q = value.trim()
    if (!q) return
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }, [value, router])

  return (
    <div id="srchwrap" ref={wrapRef}>
      <svg className="si" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        id="srch"
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => { if (suggestions.length) setOpen(true) }}
        onKeyDown={e => { if (e.key === 'Enter') goToResults() }}
        placeholder="Поиск по каталогу: черепица, профлист, утеплитель..."
        autoComplete="off"
      />

      {open && suggestions.length > 0 && (
        <div className="srch-dropdown">
          {suggestions.map(s => (
            <Link
              key={s.id}
              href={s.href}
              className="srch-item"
              onClick={() => setOpen(false)}
            >
              {s.img
                ? <img src={imgUrl(s.img)} alt={s.title} />
                : <div className="srch-item-ph">📦</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="srch-item-title">{s.title}</div>
                {s.salePrice > 0 && <div className="srch-item-price">{fmt(s.salePrice)} ₽</div>}
              </div>
            </Link>
          ))}
          <div className="srch-more" onClick={goToResults}>
            Показать все результаты{total > suggestions.length ? ` (${total})` : ''} →
          </div>
        </div>
      )}
    </div>
  )
}
