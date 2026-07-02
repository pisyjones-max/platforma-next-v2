'use client'
import Link from 'next/link'
import { imgUrl } from '@/lib/image'
import { useCart } from '@/context/CartContext'
import { useCard } from '@/context/CardContext'
import { fmt } from '@/lib/price'
import { SALE_RATE, DISC_LABEL, CARD_DISCOUNT } from '@/lib/constants'

interface Props {
  id: string
  title: string
  price: number
  img?: string
  sku?: string
  href?: string
  description?: string
  features?: Record<string, string>
  onClick?: () => void
}

function buildDesc(description?: string, features?: Record<string, string>): string {
  if (description && description.trim()) return description.trim()
  if (!features) return ''
  // Собираем ключевые характеристики для краткого описания
  const keys = ['Производитель', 'Серия', 'Гарантия, лет', 'Страна производства', 'Толщина, мм', 'В упаковке, м2']
  const parts: string[] = []
  for (const k of keys) {
    if (features[k]) parts.push(`${k}: ${features[k]}`)
    if (parts.length >= 3) break
  }
  return parts.join(' · ')
}

export function ProductCard({ id, title, price, img, sku, href, description, features, onClick }: Props) {
  const { add } = useCart()
  const { verified } = useCard()
  const salePrice = Math.round(price * SALE_RATE)
  const cardPrice = Math.round(salePrice * (1 - CARD_DISCOUNT))
  const desc = buildDesc(description, features)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    add({ sku: sku ?? id, title, price: salePrice, img: imgUrl(img ?? ''), qty: 1 })
  }

  const inner = (
    <>
      {price > 0 && <div className="pcard-discount-tag">{DISC_LABEL}</div>}
      <div className="pthumb">
        {img
          ? <img src={imgUrl(img)} alt={title} loading="lazy" />
          : <div className="ph">📦</div>
        }
      </div>
      <div className="pinfo">
        <div className="ptitle">{title}</div>
        {sku && <div className="psku">Арт. {sku}</div>}
        {desc && (
          <div style={{
            fontSize: 11.5,
            color: 'var(--muted)',
            lineHeight: 1.5,
            marginTop: 4,
            marginBottom: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>{desc}</div>
        )}
        {price > 0 ? (
          <>
            <div className="pprow">
              <span className="pp">{fmt(salePrice)} ₽</span>
              <span className="pop">{fmt(price)} ₽</span>
            </div>
            <div className="pcard-cardprice">
              {verified ? `💳 ${fmt(cardPrice)} ₽ с картой PLATFORMA` : '💳 Есть цена с картой PLATFORMA'}
            </div>
          </>
        ) : (
          <div className="pprow"><span className="psku">Цена по запросу</span></div>
        )}
      </div>
      <button className="addbtn" onClick={handleAdd}>+ В корзину</button>
    </>
  )

  if (href) return <Link href={href} className="pcard">{inner}</Link>
  return <div className="pcard" onClick={onClick}>{inner}</div>
}
