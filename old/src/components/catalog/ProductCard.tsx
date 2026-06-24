'use client'
import Image from 'next/image'
import { salePrice, fmt } from '@/lib/price'
import { useCart } from '@/context/CartContext'
import type { Product } from '@/types/catalog'

interface Props {
  product: Product
  onOpen: (id: string) => void
}

export function ProductCard({ product, onOpen }: Props) {
  const { add } = useCart()
  const v = product.variants[0]
  const fp = salePrice(v.price)
  const img = v.images?.[0]

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    add({ sku: v.sku, title: product.title, price: fp, img: img ?? '', qty: 1 })
  }

  return (
    <div className="pcard" onClick={() => onOpen(product.id)}>
      <div className="pcard-img-wrap" style={{ position: 'relative', height: 180 }}>
        {img
          ? <Image src={img} alt={product.title} fill sizes="250px" style={{ objectFit: 'cover' }} />
          : <div className="ph">📦</div>
        }
      </div>
      <div className="pcard-info">
        <div className="pname">{product.title}</div>
        {v.price > 0 ? (
          <div className="pprice-row">
            <span className="pprice">{fmt(fp)} ₽</span>
            <span className="pold">{fmt(v.price)} ₽</span>
          </div>
        ) : (
          <span className="pprice-req">Цена по запросу</span>
        )}
        <button className="padd" onClick={handleAdd}>+ В корзину</button>
      </div>
    </div>
  )
}
