'use client'
import { useUI } from '@/context/UIContext'
import { PHONE_NOTICE_ENABLED } from '@/lib/constants'

const TEXT =
  '⚠️ По техническим причинам заказы по телефону сейчас не принимаются. Пишите нам в онлайн-чат или оставьте заявку на сайте — с удовольствием ответим!'

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
