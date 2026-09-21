'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SITE_ORDER_BONUS_POINTS, REFERRAL_BONUS_POINTS, LOYALTY_FEATURES } from '@/lib/loyaltyFeatures'
import { referralLink } from '@/lib/loyaltyEngine'
import { useCard } from '@/context/CardContext'

const HIDE_KEY = 'plt_share_banner_hidden'

// Нет карты — зовём оформить. Карта уже есть — предложение оформить не показываем,
// вместо него один раз предлагаем поделиться ссылкой (скрывается насовсем после «Поделиться»/закрытия).
export function SiteOrderBonusBanner() {
  const { hasCard, phone } = useCard()
  const [hidden, setHidden] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try { setHidden(!!localStorage.getItem(HIDE_KEY)) } catch { setHidden(false) }
  }, [])

  if (hasCard) {
    if (hidden || !LOYALTY_FEATURES.referralProgram || !phone) return null
    const hide = () => { try { localStorage.setItem(HIDE_KEY, '1') } catch {} setHidden(true) }
    const share = async () => {
      const url = referralLink(window.location.origin, phone)
      const text = `Карта соседей PLATFORMA — оформи по моей ссылке, получим по ${REFERRAL_BONUS_POINTS} баллов`
      const canShare = typeof navigator.share === 'function'
      try {
        if (canShare) await navigator.share({ title: 'Карта PLATFORMA', text, url })
        else { await navigator.clipboard.writeText(url); setCopied(true) }
        setTimeout(hide, canShare ? 0 : 2500)
      } catch { /* закрыли окно «поделиться» — не прячем баннер */ }
    }
    return (
      <div className="price-promo" id="share-card-banner">
        <div className="price-promo-body">
          <div className="price-promo-badge">🤝 Приведи соседа</div>
          <div className="price-promo-title">Поделитесь картой — вы и сосед получите по +{REFERRAL_BONUS_POINTS} баллов</div>
          <div className="price-promo-sub">Отправьте свою ссылку тому, кто ещё не оформил карту.</div>
        </div>
        <button type="button" className="price-promo-cta" onClick={share} style={{ cursor: 'pointer', border: 'none' }}>
          {copied ? 'Ссылка скопирована ✓' : 'Поделиться →'}
        </button>
        <button type="button" aria-label="Скрыть" onClick={hide}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', fontSize: 18, cursor: 'pointer', alignSelf: 'flex-start' }}>×</button>
      </div>
    )
  }

  return (
    <Link href="/loyalty-card" className="price-promo" id="site-order-bonus-banner">
      <div className="price-promo-body">
        <div className="price-promo-badge">🎁 Бонус за заказ на сайте</div>
        <div className="price-promo-title">
          Оформите заказ сами на сайте — получите +{SITE_ORDER_BONUS_POINTS} баллов сверх кэшбэка
        </div>
        <div className="price-promo-sub">
          Баллы начисляются автоматически на карту «Соседи» при оформлении через корзину на сайте,
          дополнительно к прогрессивному кэшбэку. Списать баллы можно у менеджера при следующей покупке.
        </div>
      </div>
      <div className="price-promo-cta">Получить карту →</div>
    </Link>
  )
}
