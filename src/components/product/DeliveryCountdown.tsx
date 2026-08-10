'use client'
import { useEffect, useState } from 'react'
import { WORK_HOURS } from '@/lib/constants'

// Возвращает { msLeft, label } для ближайшего окна обработки заказа,
// или null, если прямо сейчас окно уже открыто и до конца больше часа
// (тогда таймер не нужен — просто показываем факт).
type WindowState =
  | { open: true; msLeft: number; cutoffLabel: string }
  | { open: false; nextLabel: string | null }

function getWindowState(now: Date): WindowState {
  // Время считаем в МСК независимо от часового пояса браузера посетителя
  const msk = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }))
  const day = msk.getDay() // 0 = вс, 6 = сб
  const hours = day === 6 ? WORK_HOURS.saturday : day === 0 ? null : WORK_HOURS.weekday

  if (hours) {
    const cutoff = new Date(msk)
    cutoff.setHours(hours.end, 0, 0, 0)
    const start = new Date(msk)
    start.setHours(hours.start, 0, 0, 0)
    if (msk >= start && msk < cutoff) {
      const cutoffLabel = `${String(hours.end).padStart(2, '0')}:00`
      return { open: true, msLeft: cutoff.getTime() - msk.getTime(), cutoffLabel }
    }
  }

  // Сейчас нерабочее время — ищем ближайшее начало рабочего окна
  const next = new Date(msk)
  next.setSeconds(0, 0)
  for (let i = 0; i < 8; i++) {
    const d = new Date(next)
    d.setDate(next.getDate() + i)
    const dow = d.getDay()
    const h = dow === 6 ? WORK_HOURS.saturday : dow === 0 ? null : WORK_HOURS.weekday
    if (!h) continue
    d.setHours(h.start, 0, 0, 0)
    if (d.getTime() > msk.getTime()) {
      const label = i === 0 ? 'сегодня' : i === 1 ? 'завтра' : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
      return { open: false, nextLabel: `${label} с ${String(h.start).padStart(2, '0')}:00` }
    }
  }
  return { open: false, nextLabel: null }
}

function formatMs(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h} ч ${m} мин`
  return `${m} мин`
}

export function DeliveryCountdown() {
  const [state, setState] = useState<WindowState | null>(null)

  useEffect(() => {
    const tick = () => setState(getWindowState(new Date()))
    tick()
    const iv = setInterval(tick, 30000)
    return () => clearInterval(iv)
  }, [])

  // На сервере ничего не рендерим — во избежание hydration mismatch
  // (время/часовой пояс посетителя нам недоступны на сервере)
  if (!state) return null

  if (state.open) {
    return (
      <div className="delivery-countdown">
        <span className="delivery-countdown-icon">🕒</span>
        <span>
          Оформите до <b>{state.cutoffLabel}</b> — менеджер обработает заказ сегодня
          {' '}(осталось {formatMs(state.msLeft)})
        </span>
      </div>
    )
  }

  return (
    <div className="delivery-countdown delivery-countdown-closed">
      <span className="delivery-countdown-icon">🕒</span>
      <span>
        Сейчас нерабочее время — заказ обработаем{' '}
        <b>{state.nextLabel ?? 'в ближайший рабочий день'}</b>
      </span>
    </div>
  )
}
