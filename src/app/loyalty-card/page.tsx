import type { Metadata } from 'next'
import { CardIssueForm } from '@/components/loyalty/CardIssueForm'
import { CARD_DISCOUNT, CASHBACK_RATE, DESIGN_PROJECT_PRICE, PHONE_NUMBER } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Карта лояльности PLATFORMA — скидка 5% и кэшбэк на кровлю и материалы',
  description:
    'Оформите бесплатную карту лояльности PLATFORMA: дополнительная скидка на все товары, кэшбэк с покупок и бонус за дизайн-проект дома. Оформление по имени и телефону — без визита в офис.',
}

const BENEFITS = [
  {
    icon: '💳',
    title: `Скидка ${Math.round(CARD_DISCOUNT * 100)}% на весь каталог`,
    text: 'Действует поверх обычной цены сайта при любой покупке — как карта постоянного покупателя в крупных магазинах.',
  },
  {
    icon: '💰',
    title: `Кэшбэк ${(CASHBACK_RATE * 100).toFixed(1)}% с каждой покупки`,
    text: 'Начисляется на карту и списывается при следующем заказе материалов.',
  },
  {
    icon: '🎁',
    title: `Бонус за дизайн-проект — до ${DESIGN_PROJECT_PRICE} ₽`,
    text: 'Если вы уже оставляли заявку на бесплатный дизайн-проект дома, стоимость услуги автоматически зачислится на карту при оформлении.',
  },
  {
    icon: '⚡',
    title: 'Оформление за 10 секунд',
    text: 'Имя и телефон — без визита в офис и без пластиковой карты на руках, всё привязано к номеру телефона.',
  },
]

export default function LoyaltyCardPage() {
  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-block', padding: '6px 14px', borderRadius: 20,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 16,
        }}>
          💳 Карта лояльности PLATFORMA
        </div>
        <h1 style={{
          fontFamily: 'var(--fh)', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800,
          lineHeight: 1.25, marginBottom: 14,
        }}>
          Скидка и кэшбэк на кровлю<br />и стройматериалы — бесплатно
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 620, margin: '0 auto' }}>
          Оформите карту лояльности по имени и телефону — дополнительная скидка{' '}
          {Math.round(CARD_DISCOUNT * 100)}% и кэшбэк начнут действовать сразу же.
        </p>
      </div>

      {/* Преимущества */}
      <h2 className="prod-section-title" style={{ marginBottom: 18 }}>Что даёт карта</h2>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14, marginBottom: 48,
      }}>
        {BENEFITS.map((b, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '18px 16px',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{b.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>{b.title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>{b.text}</div>
          </div>
        ))}
      </div>

      {/* Условия + форма */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(280px, 380px)',
        gap: 28, alignItems: 'start',
      }}>
        <div>
          <h2 className="prod-section-title" style={{ marginBottom: 14 }}>Как это работает</h2>
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <ConditionRow
              icon="📝"
              title="Заполняете имя и телефон"
              text="Форма справа — оформление занимает меньше минуты, приходить в офис не нужно."
            />
            <ConditionRow
              icon="🔗"
              title="Карта привязывается к номеру телефона"
              text="Никакого пластика — на кассе или при оформлении заказа на сайте достаточно назвать телефон."
            />
            <ConditionRow
              icon="🎁"
              title="Бонус за дизайн-проект подтягивается автоматически"
              text={`Если по этому номеру раньше была заявка на бесплатный дизайн-проект дома, ${DESIGN_PROJECT_PRICE} ₽ сразу же появятся на карте бонусом.`}
            />
            <ConditionRow
              icon="📞"
              title="Вопросы — на связи"
              text={`Позвоните нам: ${PHONE_NUMBER}, или напишите в Telegram.`}
            />
          </div>

          <h2 className="prod-section-title" style={{ margin: '32px 0 14px' }}>Частые вопросы</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FaqItem
              q="Сколько стоит карта?"
              a="Ничего. Оформление и обслуживание карты лояльности PLATFORMA полностью бесплатны."
            />
            <FaqItem
              q="Нужно ли получать пластиковую карту?"
              a="Нет. Карта привязана к номеру телефона — назовите его на кассе или при оформлении заказа на сайте, и скидка с кэшбэком применятся автоматически."
            />
            <FaqItem
              q="Откуда возьмётся бонус за дизайн-проект?"
              a={`Если вы ранее оставляли заявку на бесплатный дизайн-проект дома, при оформлении карты мы автоматически найдём эту заявку по номеру телефона и зачислим ${DESIGN_PROJECT_PRICE} ₽ бонусом — списывается при покупке материалов по проекту.`}
            />
            <FaqItem
              q="Как узнать баланс бонусов и скидку?"
              a="Уточните на кассе или у менеджера по телефону — достаточно назвать номер, привязанный к карте."
            />
          </div>
        </div>

        <div style={{ position: 'sticky', top: 90 }}>
          <CardIssueForm />
        </div>
      </div>
    </div>
  )
}

function ConditionRow({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ fontSize: 20, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>{text}</div>
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '12px 16px',
    }}>
      <summary style={{ fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>{q}</summary>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.55 }}>{a}</div>
    </details>
  )
}
