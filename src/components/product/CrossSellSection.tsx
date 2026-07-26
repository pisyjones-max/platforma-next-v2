import Link from 'next/link'
import { imgUrl } from '@/lib/image'
import { fmt } from '@/lib/price'
import { SALE_RATE, DISC_LABEL } from '@/lib/constants'
import { productSlug } from '@/lib/slug'
import type { CrossSellProduct } from '@/lib/crossSell'

interface Props {
  products: CrossSellProduct[]
}

/** Блок "С этим товаром покупают" — карточки товаров из смежных категорий/групп
 *  (правила см. src/lib/crossSell.ts). Ничего не рендерит, если рекомендаций нет. */
export function CrossSellSection({ products }: Props) {
  if (products.length === 0) return null

  return (
    <div className="prod-related">
      <h2 className="prod-section-title">С этим товаром покупают</h2>
      <div className="pgrid cross-sell-grid">
        {products.map(p => {
          const pv = p.variants[0]
          const pid = productSlug(p.id)
          return (
            <Link key={p.id} href={`/catalog/${p.catSlug}/${pid}`} className="pcard">
              {pv.price > 0 && <div className="pcard-discount-tag">{DISC_LABEL}</div>}
              <div className="pthumb">
                {pv.images?.[0]
                  ? <img src={imgUrl(pv.images[0])} alt={p.title} loading="lazy" />
                  : <div className="ph">📦</div>
                }
              </div>
              <div className="pinfo">
                <div className="ptitle">{p.title}</div>
                {pv.price > 0 ? (
                  <div className="pprow">
                    <span className="pp">{fmt(Math.round(pv.price * SALE_RATE))} ₽</span>
                    <span className="pop">{fmt(pv.price)} ₽</span>
                  </div>
                ) : (
                  <div className="pprow"><span className="psku">Цена по запросу</span></div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
