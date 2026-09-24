// Отправка данных в Яндекс.Метрику. Тег подключён в src/app/layout.tsx.
// Все вызовы безопасны: если тег ещё не загрузился или заблокирован
// (AdBlock и т.п.), они молча ничего не делают и не роняют страницу.

export const YM_ID = 109166481

type YmFn = (id: number, method: string, ...args: unknown[]) => void

function ym(method: string, ...args: unknown[]) {
  if (typeof window === 'undefined') return
  try {
    ;(window as unknown as { ym?: YmFn }).ym?.(YM_ID, method, ...args)
  } catch {
    // аналитика не должна ломать UX
  }
}

/** Виртуальный просмотр страницы (переход внутри SPA). */
export function ymHit(url: string) {
  ym('hit', url)
}

/** Достижение цели. Идентификатор цели должен быть создан в кабинете Метрики. */
export function ymGoal(goal: string, params?: Record<string, unknown>) {
  if (params) ym('reachGoal', goal, params)
  else ym('reachGoal', goal)
}

interface EcomProduct {
  id: string
  name: string
  price: number
  quantity: number
}

/** Электронная коммерция через dataLayer (в init указано ecommerce:'dataLayer'). */
export function ymEcommerce(
  action: 'add' | 'remove' | 'purchase',
  products: EcomProduct[],
  purchase?: { id: string; revenue: number },
) {
  if (typeof window === 'undefined') return
  try {
    const w = window as unknown as { dataLayer?: unknown[] }
    w.dataLayer = w.dataLayer || []
    w.dataLayer.push({
      ecommerce: {
        currencyCode: 'RUB',
        [action]: {
          ...(purchase ? { actionField: { id: purchase.id, revenue: purchase.revenue } } : {}),
          products,
        },
      },
    })
  } catch {
    // ignore
  }
}
