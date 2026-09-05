import type { Metadata } from 'next'
import { CardIssueForm } from '@/components/loyalty/CardIssueForm'
import { CARD_WELCOME_BONUS, DESIGN_PROJECT_PRICE, PHONE_NUMBER } from '@/lib/constants'
import { CASHBACK_TIERS, POINTS_EXPIRY_DAYS, REFERRAL_BONUS_POINTS } from '@/lib/loyaltyFeatures'

export const metadata: Metadata = {
  title: 'Карта лояльности PLATFORMA — 15 000 баллов на карту',
  description:
    'Оформите бесплатную карту лояльности PLATFORMA: 15 000 баллов сразу на карту, растущий кэшбэк с покупок и бонус за дизайн-проект дома. Оформление по имени и телефону — без визита в офис.',
}

const BENEFITS = [
  {
    icon: '🎁',
    title: `${CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов на карту`,
    text: 'Начисляются автоматически сразу при оформлении карты — независимо от суммы и истории покупок.',
  },
  {
    icon: '💰',
    title: `Кэшбэк растёт до ${(CASHBACK_TIERS[CASHBACK_TIERS.length - 1] * 100).toFixed(1)}%`,
    text: `${(CASHBACK_TIERS[0] * 100).toFixed(1)}% с первой покупки, дальше выше с каждым следующим заказом — списывается на следующую покупку материалов.`,
  },
  {
    icon: '🏗️',
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
          fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 16,
        }}>
          💳 Карта лояльности PLATFORMA
        </div>
        <h1 style={{
          fontFamily: 'var(--fh)', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800,
          lineHeight: 1.25, marginBottom: 14,
        }}>
          Скидка и кэшбэк на кровлю<br />и стройматериалы — бесплатно
        </h1>
        <p style={{ fontSize: 15.5, color: 'var(--muted)', maxWidth: 620, margin: '0 auto' }}>
          Оформите карту лояльности по имени и телефону — {CARD_WELCOME_BONUS.toLocaleString('ru-RU')}{' '}
          баллов начислятся сразу же, а кэшбэк растёт с каждой следующей покупкой.
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
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>{b.title}</div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>{b.text}</div>
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
              title={`${CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов начисляются сразу`}
              text="Баллы появляются на карте в момент оформления — использовать их можно на усмотрение менеджера при следующих заказах."
            />
            <ConditionRow
              icon="🏗️"
              title="Бонус за дизайн-проект подтягивается автоматически"
              text={`Если по этому номеру раньше была заявка на бесплатный дизайн-проект дома, ${DESIGN_PROJECT_PRICE} ₽ сразу же появятся на карте бонусом.`}
            />
            <ConditionRow
              icon="📞"
              title="Списание баллов — через менеджера"
              text={`Баллами не получится расплатиться автоматически на сайте: сумму списания на конкретный заказ определяет менеджер (${PHONE_NUMBER}), в зависимости от категории товара и условий поставки.`}
            />
            <ConditionRow
              icon="🤝"
              title={`+${REFERRAL_BONUS_POINTS.toLocaleString('ru-RU')} баллов за приглашённого соседа`}
              text="После оформления карты вы получите свою ссылку — по ней сосед оформит карту, а вы оба получите бонусные баллы."
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
              q="Как списать баллы?"
              a="Баллы не списываются автоматически при заказе на сайте. Назовите номер телефона, привязанный к карте, менеджеру при оформлении заказа — он определит сумму списания на усмотрение, в зависимости от категории товара и условий поставки."
            />
            <FaqItem
              q="Как узнать баланс баллов и скидку?"
              a="Уточните на кассе или у менеджера по телефону — достаточно назвать номер, привязанный к карте."
            />
            <FaqItem
              q="Баллы сгорают?"
              a={`Да, если по карте нет новых покупок дольше ${POINTS_EXPIRY_DAYS} дней. Любая новая покупка снова обнуляет этот срок.`}
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
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>{text}</div>
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
      <summary style={{ fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>{q}</summary>
      <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.55 }}>{a}</div>
    </details>
  )
}
