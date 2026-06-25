'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'

type Mode = 'roofing' | 'insulation' | 'siding' | 'gutter'

const MODES: { id: Mode; icon: string; label: string }[] = [
  { id: 'roofing',    icon: '🏠', label: 'Кровля' },
  { id: 'insulation', icon: '🧱', label: 'Утеплитель' },
  { id: 'siding',     icon: '🏗️', label: 'Сайдинг' },
  { id: 'gutter',     icon: '🌧️', label: 'Водостоки' },
]

const SEARCH_LINKS: Record<Mode, string> = {
  roofing:    '/catalog/group/krovlya',
  insulation: '/catalog/group/izolyatsiya',
  siding:     '/catalog/group/fasad',
  gutter:     '/catalog/group/vodostoki',
}

function NumField({ label, value, onChange, unit, min = 0.1, step = 0.5 }: {
  label: string; value: number; onChange: (v: number) => void
  unit?: string; min?: number; step?: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{label}{unit ? `, ${unit}` : ''}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <button
          onClick={() => onChange(Math.max(min, +(value - step).toFixed(1)))}
          style={{ width: 36, height: 42, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 }}
        >−</button>
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={e => onChange(Math.max(min, parseFloat(e.target.value) || min))}
          style={{ flex: 1, border: 'none', background: 'none', textAlign: 'center', fontSize: 15, fontWeight: 700, color: 'var(--text)', outline: 'none', minWidth: 0 }}
        />
        <button
          onClick={() => onChange(+(value + step).toFixed(1))}
          style={{ width: 36, height: 42, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 }}
        >+</button>
      </div>
    </div>
  )
}

export function HomeCalculator() {
  const [mode, setMode] = useState<Mode>('roofing')

  // Кровля
  const [rLen, setRLen] = useState(10)
  const [rWid, setRWid] = useState(6)
  const [rSlopes, setRSlopes] = useState(2)
  const [rMargin, setRMargin] = useState(10)

  // Утеплитель
  const [iArea, setIArea] = useState(60)
  const [iLayers, setILayers] = useState(1)
  const [iMargin, setIMargin] = useState(10)

  // Сайдинг
  const [sH, setSH] = useState(3)
  const [sPerim, setSPerim] = useState(40)
  const [sOpen, setSOPen] = useState(10)
  const [sMargin, setSMargin] = useState(10)

  // Водостоки
  const [gPerim, setGPerim] = useState(40)
  const [gMargin, setGMargin] = useState(10)

  const result = useCallback((): { area: number; unit: string; label: string; hint: string } => {
    const m = (pct: number) => 1 + pct / 100
    if (mode === 'roofing') {
      const area = rLen * rWid * rSlopes * m(rMargin)
      return { area, unit: 'м²', label: `${area.toFixed(1)} м² кровельного материала`, hint: `${rSlopes} скат(а) × ${rLen}×${rWid} м + ${rMargin}% запас` }
    }
    if (mode === 'insulation') {
      const area = iArea * iLayers * m(iMargin)
      return { area, unit: 'м²', label: `${area.toFixed(1)} м² утеплителя`, hint: `${iArea} м² × ${iLayers} слой(я) + ${iMargin}% запас` }
    }
    if (mode === 'siding') {
      const area = (sH * sPerim - sOpen) * m(sMargin)
      return { area, unit: 'м²', label: `${area.toFixed(1)} м² сайдинга`, hint: `${sH}м × ${sPerim}м периметр − ${sOpen}м² проёмы + ${sMargin}% запас` }
    }
    // gutter
    const len = gPerim * m(gMargin)
    return { area: len, unit: 'м', label: `${len.toFixed(1)} м водостока`, hint: `${gPerim} м периметра + ${gMargin}% запас` }
  }, [mode, rLen, rWid, rSlopes, rMargin, iArea, iLayers, iMargin, sH, sPerim, sOpen, sMargin, gPerim, gMargin])

  const res = result()

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
      borderRadius: 20,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      marginTop: 40,
    }}>
      {/* Заголовок */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3828 0%, #253d2b 100%)',
        padding: '22px 24px 18px',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>🧮</span>
          <h2 style={{ margin: 0, fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800 }}>
            Калькулятор материалов
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>
          Рассчитайте нужное количество за 30 секунд
        </p>
      </div>

      <div style={{ padding: '20px 24px 24px' }}>
        {/* Выбор типа */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: `2px solid ${mode === m.id ? '#7ecc9a' : 'var(--border)'}`,
              background: mode === m.id ? 'rgba(126,204,154,.12)' : 'var(--bg)',
              color: mode === m.id ? '#7ecc9a' : 'var(--muted)',
              fontWeight: mode === m.id ? 700 : 400,
              fontSize: 13, cursor: 'pointer', transition: 'all .15s',
            }}>
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>

        {/* Поля ввода */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          {mode === 'roofing' && <>
            <NumField label="Длина ската" value={rLen} onChange={setRLen} unit="м" />
            <NumField label="Ширина ската" value={rWid} onChange={setRWid} unit="м" />
            <NumField label="Кол-во скатов" value={rSlopes} onChange={setRSlopes} unit="шт" min={1} step={1} />
            <NumField label="Запас" value={rMargin} onChange={setRMargin} unit="%" min={0} step={5} />
          </>}
          {mode === 'insulation' && <>
            <NumField label="Площадь" value={iArea} onChange={setIArea} unit="м²" />
            <NumField label="Слоёв" value={iLayers} onChange={setILayers} unit="шт" min={1} step={1} />
            <NumField label="Запас" value={iMargin} onChange={setIMargin} unit="%" min={0} step={5} />
          </>}
          {mode === 'siding' && <>
            <NumField label="Высота стены" value={sH} onChange={setSH} unit="м" />
            <NumField label="Периметр" value={sPerim} onChange={setSPerim} unit="м" />
            <NumField label="Проёмы" value={sOpen} onChange={setSOPen} unit="м²" min={0} />
            <NumField label="Запас" value={sMargin} onChange={setSMargin} unit="%" min={0} step={5} />
          </>}
          {mode === 'gutter' && <>
            <NumField label="Периметр кровли" value={gPerim} onChange={setGPerim} unit="м" />
            <NumField label="Запас" value={gMargin} onChange={setGMargin} unit="%" min={0} step={5} />
          </>}
        </div>

        {/* Результат */}
        <div style={{
          background: 'rgba(126,204,154,.1)',
          border: '1.5px solid rgba(126,204,154,.35)',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>Потребуется:</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#7ecc9a', lineHeight: 1.1 }}>
              {res.label}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>{res.hint}</div>
          </div>
          <Link
            href={SEARCH_LINKS[mode]}
            style={{
              display: 'inline-block',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #7ecc9a, #4caf70)',
              borderRadius: 12,
              color: '#0d1f14',
              fontWeight: 800,
              fontSize: 13.5,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Подобрать материал →
          </Link>
        </div>

        <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '10px 0 0', lineHeight: 1.5 }}>
          Точный расчёт с учётом типа материала и раскладки — бесплатно у нашего специалиста.{' '}
          <a href="tel:+79332033005" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Позвоните нам
          </a>
        </p>
      </div>
    </div>
  )
}
