'use client'
import { useState } from 'react'
import { useCard } from '@/context/CardContext'
import { useUI } from '@/context/UIContext'
import { fmt } from '@/lib/price'
import { formatPhone } from '@/lib/phone'
import { DISC_LABEL } from '@/lib/constants'

interface Props {
  fullPrice: number   // v.price — зачёркнутая цена
  regularPrice: number // fp — обычная цена сайта (для всех, без карты)
  cardPrice: number    // цена с картой PLATFORMA
}

export function CardPriceBlock({ fullPrice, regularPrice, cardPrice }: Props) {
  const { verified, phone, checking, error, verify, reset } = useCard()
  const { openLoyalty } = useUI()
  const [input, setInput] = useState('')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    await verify(input)
  }

  const maskedPhone = phone ? `••${phone.slice(-4, -2)}-${phone.slice(-2)}` : ''

  return (
    <div className="prod-price-block">
      <div className="prod-cardprice-row">
        {verified ? (
          <div className="prod-cardprice-pill">
            <span className="prod-cardprice-icon">💳</span>
            <span className="prod-cardprice-val">{fmt(cardPrice)} ₽</span>
          </div>
        ) : (
          <div className="prod-cardprice-pill prod-cardprice-locked">
            <span className="prod-cardprice-icon">🔒</span>
            <span className="prod-cardprice-val">от {fmt(cardPrice)} ₽</span>
          </div>
        )}
        {verified ? (
          <span className="prod-cardprice-label">
            с картой PLATFORMA · подтверждена {maskedPhone}{' '}
            <button type="button" className="prod-cardprice-changelink" onClick={reset}>сменить</button>
          </span>
        ) : (
          <span className="prod-cardprice-label">цена с картой PLATFORMA — подтвердите номер телефона</span>
        )}
      </div>

      <div className="prod-price-sub-row">
        <span className="prod-price">{fmt(regularPrice)} ₽</span>
        <span className="prod-oldprice">{fmt(fullPrice)} ₽</span>
        <span className="prod-disc">{DISC_LABEL}</span>
      </div>

      {!verified && (
        <form className="prod-cardverify-form" onSubmit={handleVerify}>
          <input
            className="prod-cardverify-input"
            type="tel"
            inputMode="tel"
            placeholder="+7 (___) ___-__-__"
            value={input}
            onChange={e => setInput(formatPhone(e.target.value))}
          />
          <button type="submit" className="prod-cardverify-btn" disabled={checking || !input}>
            {checking ? 'Проверяем…' : 'Показать цену'}
          </button>
        </form>
      )}

      {!verified && error && (
        <div className="prod-cardverify-error">
          {error}.{' '}
          <button type="button" className="prod-get-card-btn" onClick={openLoyalty}>
            Нет карты? Оформите бесплатно →
          </button>
        </div>
      )}

      {!verified && !error && (
        <button type="button" className="prod-get-card-btn" onClick={openLoyalty}>
          Нет карты? Оформите бесплатно →
        </button>
      )}
    </div>
  )
}
