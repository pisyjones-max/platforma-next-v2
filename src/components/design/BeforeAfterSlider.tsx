'use client'
import { useState } from 'react'

interface Props {
  /** URL фото "до". Если не задан — рисуется плейсхолдер до появления реальных рендеров. */
  beforeSrc?: string
  /** URL фото "после" (рендер с материалом). */
  afterSrc?: string
  /** Подпись под слайдером, например "Сайдинг Docke Blockhouse, цвет Дуб" */
  caption?: string
  /** Цвет плейсхолдера "до" (нейтральный дом) */
  placeholderBeforeLabel?: string
  placeholderAfterLabel?: string
}

// Слайдер до/после на чистом React + range input — без внешних библиотек.
// Пока нет реальных фото клиентов, рендерится текстовый плейсхолдер того же
// размера/формы, чтобы компонент можно было включить в проект уже сейчас
// и просто подставить beforeSrc/afterSrc, когда будут готовы рендеры.
export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  caption,
  placeholderBeforeLabel = 'ДО',
  placeholderAfterLabel = 'ПОСЛЕ',
}: Props) {
  const [pos, setPos] = useState(50)

  return (
    <div className="bas-wrap">
      <div className="bas-frame">
        {/* Слой "до" — виден полностью, фон */}
        <div className="bas-layer">
          {beforeSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={beforeSrc} alt="Дом до" className="bas-img" />
          ) : (
            <div className="bas-placeholder bas-placeholder-before">
              <span>{placeholderBeforeLabel}</span>
            </div>
          )}
        </div>

        {/* Слой "после" — обрезается по ширине через clip-path */}
        <div className="bas-layer" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {afterSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={afterSrc} alt="Дом после дизайн-проекта" className="bas-img" />
          ) : (
            <div className="bas-placeholder bas-placeholder-after">
              <span>{placeholderAfterLabel}</span>
            </div>
          )}
        </div>

        {/* Разделительная линия + ручка */}
        <div className="bas-divider" style={{ left: `${pos}%` }}>
          <div className="bas-handle">⇆</div>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={e => setPos(Number(e.target.value))}
          className="bas-range"
          aria-label="Сравнить дом до и после"
        />
      </div>
      {caption && <div className="bas-caption">{caption}</div>}
    </div>
  )
}
