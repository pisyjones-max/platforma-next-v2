'use client'
import { useCard } from '@/context/CardContext'
import { useUI } from '@/context/UIContext'
import { fmt } from '@/lib/price'
import { CARD_WELCOME_BONUS, CASHBACK_RATE } from '@/lib/constants'

interface Props {
  fullPrice: number   // v.price — зачёркнутая цена
  regularPrice: number // fp — цена сайта (единая для всех, скидка по карте убрана)
}

export function CardPriceBlock({ fullPrice, regularPrice }: Props) {
  const { verified } = useCard()
  const { openLoyalty } = useUI()

  return (
    <div className="prod-price-block">
      <div className="prod-price-sub-row">
        <span className="prod-price">{fmt(regularPrice)} ₽</span>
        <span className="prod-oldprice">{fmt(fullPrice)} ₽</span>
      </div>

      <div className="prod-cardprice-row">
        <div className="prod-cardprice-pill">
          <span className="prod-cardprice-icon">💳</span>
          <span className="prod-cardprice-val">
            {CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов + кэшбэк {(CASHBACK_RATE * 100).toFixed(1)}%
          </span>
        </div>
        <span className="prod-cardprice-label">по карте лояльности PLATFORMA</span>
      </div>

      {!verified && (
        <button type="button" className="prod-get-card-btn" onClick={openLoyalty}>
          Нет карты? Оформите бесплатно →
        </button>
      )}
    </div>
  )
}
