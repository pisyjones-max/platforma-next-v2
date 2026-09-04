'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useUI } from '@/context/UIContext'
import { imgUrl } from '@/lib/image'
import { fmt, salePrice } from '@/lib/price'
import { getCalcType } from '@/lib/calculator'
import { productSlug } from '@/lib/slug'
import { Calculator } from '@/components/calculator/Calculator'
import { AddedToCartToast } from '@/components/ui/AddedToCartToast'
import { CardPriceBlock } from '@/components/product/CardPriceBlock'
import { CrossSellSection } from '@/components/product/CrossSellSection'
import { DeliveryCountdown } from '@/components/product/DeliveryCountdown'
import { AskKevPresets } from '@/components/product/AskKevPresets'
import { getServicesForGroup } from '@/lib/services'
import type { Product } from '@/types/catalog'
import type { CrossSellProduct } from '@/lib/crossSell'
import type { FaqItem } from '@/lib/productFaq'

export type RelatedProduct = {
  id: string
  title: string
  price: number
  image?: string
}

interface Props {
  product: Product
  categorySlug: string
  categoryName: string
  groupSlug: string
  groupName: string
  otherProducts?: RelatedProduct[]
  crossSellProducts?: CrossSellProduct[]
  faq?: FaqItem[]
}

export function ProductPage({ product, categorySlug, categoryName, groupSlug, groupName, otherProducts = [], crossSellProducts = [], faq = [] }: Props) {
  const { add } = useCart()
  const { openCart } = useUI()
  const [varIdx, setVarIdx] = useState(0)
  const [imgIdx, setImgIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [toastShow, setToastShow] = useState(false)
  const [toastTitle, setToastTitle] = useState('')
  const [lightbox, setLightbox] = useState(false)
  const [lbIdx, setLbIdx] = useState(0)
  const [callOpen, setCallOpen] = useState(false)
  const [callPhone, setCallPhone] = useState('')
  const [callSent, setCallSent] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const v = product.variants[varIdx]
  const fp = salePrice(v.price)
  const imgs = v.images ?? []

  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width * 100).toFixed(1)
    const y = ((e.clientY - r.top) / r.height * 100).toFixed(1)
    e.currentTarget.style.setProperty("--zoom-x", x + "%")
    e.currentTarget.style.setProperty("--zoom-y", y + "%")
  }
  const type = getCalcType(groupSlug, categorySlug, categoryName, product.title)

  // Lightbox navigation
  const lbPrev = useCallback(() => setLbIdx(i => (i - 1 + imgs.length) % imgs.length), [imgs.length])
  const lbNext = useCallback(() => setLbIdx(i => (i + 1) % imgs.length), [imgs.length])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowLeft') lbPrev()
      if (e.key === 'ArrowRight') lbNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, lbPrev, lbNext])

  const openLightbox = (i: number) => { setLbIdx(i); setLightbox(true) }

  const handleAdd = (addQty = qty, label?: string) => {
    const title = label ?? (product.title + (v.color ? ` (${v.color})` : ''))
    add({ sku: v.sku, title, price: fp, img: imgUrl(imgs[0] ?? ''), qty: addQty })
    setToastTitle(title)
    setToastShow(true)
  }

  const handleCall = async () => {
    if (!callPhone) return
    await fetch('/api/order/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: callPhone, product: product.title }),
    })
    setCallSent(true)
  }

  return (
    <div id="main">
      {/* Хлебные крошки */}
      <nav className="breadcrumb">
        <span className="bc-item bc-link"><Link href="/">Каталог</Link></span>
        {groupSlug && <><span className="bc-sep">›</span>
          <span className="bc-item bc-link"><Link href={`/catalog/group/${groupSlug}`}>{groupName}</Link></span></>}
        <span className="bc-sep">›</span>
        <span className="bc-item bc-link"><Link href={`/catalog/${categorySlug}`}>{categoryName}</Link></span>
        <span className="bc-sep">›</span>
        <span className="bc-item bc-cur">{product.title}</span>
      </nav>

      {/* Основной блок */}
      <div className="prod-layout">

        {/* Галерея */}
        <div className="prod-gal">
          <div className="prod-main-img" onMouseMove={handleZoomMove} onClick={() => openLightbox(imgIdx)}
            style={{ cursor: 'zoom-in' }}>
            {imgs.length > 0
              ? <img src={imgUrl(imgs[imgIdx])} alt={product.title} loading="eager" />
              : <div className="ph-big">📦</div>
            }
          </div>
          {imgs.length > 1 && (
            <div className="prod-thumbs">
              {imgs.map((src, i) => (
                <div key={i} className={`prod-thumb ${i === imgIdx ? 'active' : ''}`}
                  onClick={() => setImgIdx(i)}>
                  <img src={imgUrl(src)} alt="" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightbox && imgs.length > 0 && (
          <div className="img-lightbox" onClick={() => setLightbox(false)}>
            <button className="img-lightbox-close" onClick={e => { e.stopPropagation(); setLightbox(false) }}>✕</button>

            {imgs.length > 1 && (
              <button onClick={e => { e.stopPropagation(); lbPrev() }} style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff',
                fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .15s', zIndex: 1,
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.15)')}
              >‹</button>
            )}

            <img
              src={imgUrl(imgs[lbIdx])}
              alt={product.title}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 }}
            />

            {imgs.length > 1 && (
              <button onClick={e => { e.stopPropagation(); lbNext() }} style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff',
                fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .15s', zIndex: 1,
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.15)')}
              >›</button>
            )}

            {imgs.length > 1 && (
              <div style={{
                position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 6,
              }}>
                {imgs.map((_, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setLbIdx(i) }} style={{
                    width: i === lbIdx ? 24 : 8, height: 8, borderRadius: 4,
                    background: i === lbIdx ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.3)',
                    border: 'none', cursor: 'pointer', transition: 'all .2s', padding: 0,
                  }} />
                ))}
              </div>
            )}

            <div style={{ position: 'absolute', bottom: 50, right: 20, color: 'rgba(255,255,255,.4)', fontSize: 13 }}>
              {lbIdx + 1} / {imgs.length}
            </div>
          </div>
        )}

        {/* Инфо */}
        <div className="prod-info">
          <h1 className="prod-title">{product.title}</h1>
          <div className="prod-sku">Арт. {v.sku}</div>

          {/* Цена */}
          {v.price > 0 ? (
            <CardPriceBlock fullPrice={v.price} regularPrice={fp} />
          ) : (
            <div className="prod-price-block">
              <span className="prod-price-req">Цена по запросу</span>
            </div>
          )}

          {v.pack_quantity && v.pack_quantity > 1 && (
            <div className="prod-pack-note">
              Упаковка: {v.pack_quantity} шт · {fmt(fp * v.pack_quantity)} ₽/уп
            </div>
          )}

          {/* Варианты */}
          {product.variants.length > 1 && (
            <div className="prod-section">
              <div className="vlabel">Вариант</div>
              <div className="vlist">
                {product.variants.map((vv, i) => (
                  <button key={i} className={`vbtn ${i === varIdx ? 'active' : ''}`}
                    onClick={() => { setVarIdx(i); setImgIdx(0) }}>
                    {vv.sku_name ?? vv.color ?? vv.sku}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Количество */}
          <div className="prod-section">
            <div className="vlabel">Количество</div>
            <div className="qrow" style={{ marginTop: 8 }}>
              <button className="qbtn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="qval">{qty}</span>
              <button className="qbtn" onClick={() => setQty(q => q + 1)}>+</button>
              {v.price > 0 && (
                <span style={{ marginLeft: 12, fontSize: 15.5, fontWeight: 700, color: 'var(--accent)' }}>
                  = {fmt(fp * qty)} ₽
                </span>
              )}
            </div>
          </div>

          {/* CTA кнопки */}
          <div className="prod-cta">
            <button className="prod-add-btn" onClick={() => handleAdd()}>
              + В корзину
            </button>
            <button className="prod-call-btn" onClick={() => setCallOpen(o => !o)}>
              📞 Перезвоните мне
            </button>
          </div>

          <DeliveryCountdown />

          <AskKevPresets productTitle={product.title} />

          {/* Форма обратного звонка */}
          {callOpen && (
            <div className="prod-callback">
              {callSent ? (
                <div className="prod-callback-ok">✅ Перезвоним в течение 15 минут!</div>
              ) : (
                <>
                  <input className="finp" placeholder="+7 (___) ___-__-__" value={callPhone}
                    onChange={e => setCallPhone(e.target.value)} style={{ marginBottom: 8 }} />
                  <button className="prod-add-btn" onClick={handleCall}>Перезвоните мне</button>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                    Нажимая кнопку, вы соглашаетесь с{' '}
                    <Link href="/privacy" style={{ textDecoration: 'underline' }}>политикой обработки данных</Link> (ФЗ-152)
                  </p>
                </>
              )}
            </div>
          )}

          {/* Преимущества */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {['🚚 Доставка по МО', '✅ Гарантия', '💳 Кэшбэк 0.5%'].map((t, i) => (
              <div key={i} style={{
                fontSize: 12, fontWeight: 500, background: 'var(--surface2)',
                border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 20,
                color: 'var(--muted)',
              }}>{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Калькулятор — только для категорий где он имеет смысл */}
      {type !== null && (
        <div style={{ marginTop: 24 }}>
          <Calculator groupSlug={groupSlug} catSlug={categorySlug} catName={categoryName} product={product} />
        </div>
      )}

      {/* Характеристики */}
      {Object.keys(product.features ?? {}).length > 0 && (
        <div className="prod-features">
          <h2 className="prod-section-title">Характеристики</h2>
          <div className="fgrid">
            {Object.entries(product.features!).map(([k, val]) => (
              <div key={k} className="frow">
                <div className="fkey">{k}</div>
                <div className="fval">{val}</div>
              </div>            ))}
          </div>
        </div>
      )}

      {/* Описание (полное) */}
      {product.description && (
        <div className="prod-desc">
          <h2 className="prod-section-title">Описание</h2>
          <p className="mdesc">{product.description}</p>
        </div>
      )}

      {/* Вопросы и ответы — универсальный блок, буквально соответствует FAQPage
          schema в src/app/catalog/[catSlug]/[productId]/page.tsx (см. комментарий
          в src/lib/productFaq.ts про требование Google/Яндекс к соответствию
          видимого контента и разметки) */}
      {faq.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 className="prod-section-title">Вопросы и ответы</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {faq.map((item, i) => {
              const isOpen = openFaq === i
              return (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface)',
                    border: `1.5px solid ${isOpen ? 'rgba(126,204,154,.4)' : 'var(--border)'}`,
                    borderRadius: 14,
                    overflow: 'hidden',
                    transition: 'border-color .2s',
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: 12,
                      padding: '14px 18px', background: 'none', border: 'none',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, flex: 1 }}>
                      {item.q}
                    </span>
                    <span style={{
                      fontSize: 18, color: isOpen ? '#7ecc9a' : 'var(--muted)',
                      transition: 'transform .25s, color .2s',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      flexShrink: 0, lineHeight: 1,
                    }}>+</span>
                  </button>
                  <div style={{ maxHeight: isOpen ? 400 : 0, overflow: 'hidden', transition: 'max-height .3s cubic-bezier(0.4,0,0.2,1)' }}>
                    <div style={{
                      padding: '0 18px 16px', fontSize: 14, lineHeight: 1.7, color: 'var(--muted)',
                      borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 0,
                    }}>
                      {item.a}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* С этим товаром покупают */}
      <CrossSellSection products={crossSellProducts} />

      {getServicesForGroup(groupSlug).map(service => (
        <Link key={service.slug} href={service.urlPath} className="design-strip montazh-strip">
          <div className="design-strip-text">
            {service.ctaLabel}
            <small>{service.ctaSubLabel}</small>
          </div>
          <div className="design-strip-cta">Оставить заявку →</div>
        </Link>
      ))}

      {/* Похожие товары */}
      <div className="prod-related">
        <h2 className="prod-section-title">Другие товары в категории</h2>
        <div className="pgrid">
          {otherProducts.map(p => {
            // productSlug() — см. аналогичный фикс и комментарий в CategoryPage.tsx:
            // сырой p.id.split('--').pop() давал 404 на части товаров.
            const pid = productSlug(p.id)
            return (
              <Link key={p.id} href={`/catalog/${categorySlug}/${pid}`} className="pcard">
                <div className="pthumb">
                  {p.image
                    ? <img src={imgUrl(p.image)} alt={p.title} loading="lazy" />
                    : <div className="ph">📦</div>
                  }
                </div>
                <div className="pinfo">
                  <div className="ptitle">{p.title}</div>
                  {p.price > 0 ? (
                    <div className="pprow">
                      <span className="pp">{fmt(salePrice(p.price))} ₽</span>
                      <span className="pop">{fmt(p.price)} ₽</span>
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

      {/* Toast "добавлено в корзину" */}
      <AddedToCartToast
        show={toastShow}
        productTitle={toastTitle}
        onClose={() => setToastShow(false)}
        onGoToCart={() => { setToastShow(false); openCart() }}
      />
    </div>
  )
}
