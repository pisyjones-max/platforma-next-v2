'use client'
import { useState } from 'react'
import Link from 'next/link'
import { RoofCalculator } from '@/components/calculator/RoofCalculator'
import { InsulationCalculator } from '@/components/calculator/InsulationCalculator'
import { SidingCalculator } from '@/components/calculator/SidingCalculator'
import { GutterCalculator } from '@/components/calculator/GutterCalculator'

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
  siding:     '/catalog/group/sayding',
  gutter:     '/catalog/group/vodostoki',
}

// HomeCalculator — тизер на главной. Использует те же детальные калькуляторы
// (списки стен/скатов + BOM), что и карточки товара, просто без product
// (кнопка «в корзину» внутри них сама скрывается, если product не передан) —
// вместо неё здесь CTA-ссылка в нужный раздел каталога.
export function HomeCalculator() {
  const [mode, setMode] = useState<Mode>('roofing')

  return (
    <div id="home-calculator" style={{
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
        <p style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>
          Точный расчёт по вашему дому — стены, скаты, углы, проёмы
        </p>
      </div>

      <div style={{ padding: '20px 24px 24px' }}>
        {/* Выбор типа */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: `2px solid ${mode === m.id ? '#7ecc9a' : 'var(--border)'}`,
              background: mode === m.id ? 'rgba(126,204,154,.12)' : 'var(--bg)',
              color: mode === m.id ? '#3d7a54' : 'var(--muted)',
              fontWeight: mode === m.id ? 700 : 400,
              fontSize: 14, cursor: 'pointer', transition: 'all .15s',
            }}>
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>

        {mode === 'roofing' && <RoofCalculator />}
        {mode === 'insulation' && <InsulationCalculator />}
        {mode === 'siding' && <SidingCalculator />}
        {mode === 'gutter' && <GutterCalculator />}

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            href={SEARCH_LINKS[mode]}
            style={{
              display: 'inline-block',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #7ecc9a, #4caf70)',
              borderRadius: 12,
              color: '#0d1f14',
              fontWeight: 800,
              fontSize: 14.5,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Подобрать материал →
          </Link>
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '10px 0 0', lineHeight: 1.5 }}>
          Точный расчёт с учётом типа материала и раскладки — бесплатно у нашего специалиста.{' '}
          <a href="tel:+79332033005" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Позвоните нам
          </a>
        </p>
      </div>
    </div>
  )
}
