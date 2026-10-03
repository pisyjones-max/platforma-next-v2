import type { Metadata } from 'next'
import Link from 'next/link'
import { OWNER_INFO, CONTACT_EMAIL, MAX_ACCOUNT_LABEL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Условия и цены',
  description: 'Условия работы сервиса PLATFORMA: цены и наличие, оформление заказа, доставка. Информация не является публичной офертой.',
  alternates: { canonical: '/ceny-i-nalichie' },
}

const POINTS = [
  'PLATFORMA — сервис подбора и заказа строительных и кровельных материалов. Заказы, оформленные на сайте, мы передаём партнёрам-поставщикам, которые подтверждают цену, наличие и условия и отгружают товар со своих складов.',
  'Цены, остатки и описания товаров на сайте носят информационный характер и не являются публичной офертой, определяемой положениями ст. 437 Гражданского кодекса РФ.',
  'Рынок строительных и кровельных материалов нестабилен: цены зависят от сезонности, курса валют, цен производителей и загрузки складов, поэтому могут меняться, в том числе в течение дня.',
  'После оформления заказа менеджер связывается с вами, уточняет детали, рассчитывает доставку (на объект или в пункт выдачи) и подтверждает итоговую стоимость. Заказ считается принятым после этого подтверждения.',
  'Оплата и получение товара согласуются при подтверждении заказа: условия, порядок расчётов и документы определяются партнёром-поставщиком, который передаёт вам товар.',
  'Фотографии, цвета и характеристики носят справочный характер, актуальные данные уточняйте у менеджера и в документации производителя.',
]

export default function PriceNoticePage() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 80px' }}>
      <h1 style={{ fontFamily: 'var(--fh)', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
        Условия и цены
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 15.5 }}>
        Как мы работаем и почему цены нужно уточнять
      </p>

      <ol style={{ display: 'grid', gap: 14, paddingLeft: 20, fontSize: 15.5, lineHeight: 1.65 }}>
        {POINTS.map((t, i) => <li key={i}>{t}</li>)}
      </ol>

      <div style={{
        marginTop: 36, padding: '22px 26px', borderRadius: 16,
        background: 'var(--surface2)', border: '1px solid var(--border)',
        fontSize: 15.5, lineHeight: 1.6,
      }}>
        <strong>Напишите нам в онлайн-чат или оставьте заявку</strong> — менеджер даст актуальную цену и
        честный ответ по остаткам на складах партнёров.
        <div style={{ marginTop: 12 }}>
          <Link href="/catalog" style={{ color: 'var(--accent)', fontWeight: 600 }}>Перейти в каталог →</Link>
        </div>
      </div>

      <p style={{ marginTop: 28, fontSize: 12.5, lineHeight: 1.6, color: 'var(--muted)' }}>
        Владелец сервиса: {OWNER_INFO}. Обращения и претензии: e-mail{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'inherit' }}>{CONTACT_EMAIL}</a>, онлайн-чат на сайте, MAX ({MAX_ACCOUNT_LABEL}, только сообщения) или Telegram{' '}
        <a href="https://t.me/platforma_roof" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>@platforma_roof</a>.
      </p>
    </div>
  )
}
