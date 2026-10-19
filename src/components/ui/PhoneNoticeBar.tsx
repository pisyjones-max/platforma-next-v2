'use client'
import { useUI } from '@/context/UIContext'
import { PHONE_NOTICE_ENABLED } from '@/lib/constants'

const TEXT =
  '⏳ Сейчас высокая загрузка менеджеров — дозвониться может быть сложно. Пожалуйста, оставляйте заказ на сайте или пишите в онлайн-чат: ответим в порядке очереди.'

export function PhoneNoticeBar() {
  const { openChat } = useUI()
  if (!PHONE_NOTICE_ENABLED) return null

  const items = [0, 1, 2, 3]
  return (
    <div className="pnb" role="status">
      <div className="pnb-track">
        {items.map(i => (
          <span key={i} className="pnb-item" aria-hidden={i > 0 ? true : undefined}>
            {TEXT}
            <button type="button" className="pnb-btn" onClick={() => openChat()}>
              Написать в чат →
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
