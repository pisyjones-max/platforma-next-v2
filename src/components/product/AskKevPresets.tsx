'use client'
import { useUI } from '@/context/UIContext'

interface Props {
  productTitle: string
}

// Быстрые вопросы к менеджеру ("Ask Kev") — открывают виджет чата
// (TelegramChat) с готовым текстом вопроса про конкретный товар.
export function AskKevPresets({ productTitle }: Props) {
  const { openChat } = useUI()

  const presets = [
    { icon: '📐', auto: true, label: 'Как использовать?', text: `Подскажите, как правильно использовать «${productTitle}»?` },
    { icon: '🧮', auto: true, label: 'Сколько нужно?', text: `Помогите рассчитать, сколько «${productTitle}» мне понадобится?` },
    { icon: '🚚', auto: true, label: 'Когда привезёте?', text: `Уточните, пожалуйста, сроки доставки «${productTitle}» в мой город.` },
    { icon: '💬', auto: false, label: 'Другой вопрос', text: `Вопрос по товару «${productTitle}»: ` },
  ]

  return (
    <div className="ask-kev">
      <div className="ask-kev-title">Есть вопрос по товару?</div>
      <div className="ask-kev-row">
        {presets.map(p => (
          <button
            key={p.label}
            type="button"
            className="ask-kev-chip"
            onClick={() => openChat(p.text, p.auto)}
          >
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
