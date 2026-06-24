'use client'
import Link from 'next/link'
import { imgUrl } from '@/lib/image'
import { useCart } from '@/context/CartContext'
import { fmt } from '@/lib/price'

interface Props {
  id: string
  title: string
  price: number
  img?: string
  sku?: string
  href?: string
  onClick?: () => void
}

export function ProductCard({ id, title, price, img, sku, href, onClick }: Props) {
  const { add } = useCart()
  const salePrice = Math.round(price * 0.93)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    add({ sku: sku ?? id, title, price, img: imgUrl(img ?? ''), qty: 1 })
  }

  const inner = (
    <>
      {price > 0 && <div className="pcard-discount-tag">−7%</div>}
      <div className="pthumb">
        {img
          ? <img src={imgUrl(img)} alt={title} loading="lazy" />
          : <div className="ph">📦</div>
        }
      </div>
      <div className="pinfo">
        <div className="ptitle">{title}</div>
        {sku && <div className="psku">Арт. {sku}</div>}
        {price > 0 ? (
          <div className="pprow">
            <span className="pp">{fmt(salePrice)} ₽</span>
            <span className="pop">{fmt(price)} ₽</span>
          </div>
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
