import type { Metadata } from 'next'
import { PriceMatchForm } from '@/components/pricematch/PriceMatchForm'
import { PHONE_NUMBER } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Перебьём цену конкурента минимум на 5% — PLATFORMA',
  description:
    'Нашли кровельные или строительные материалы дешевле у другого поставщика в Москве и Раменском округе? Пришлите нам цену — предложим ниже минимум на 5%.',
}

const STEPS = [
  {
    icon: '📋',
    title: 'Присылаете цену конкурента',
    text: 'Название товара, цена и, если есть, скриншот прайса или ссылка на страницу товара.',
  },
  {
    icon: '🔎',
    title: 'Мы сверяем товар',
    text: 'Проверяем, что это тот же материал, того же производителя и в том же объёме.',
  },
  {
    icon: '💰',
    title: 'Предлагаем цену ниже',
    text: 'Минимум на 5% дешевле цены конкурента — с учётом ваших объёмов может быть выгоднее.',
  },
  {
    icon: '🛒',
    title: 'Оформляете заказ',
    text: 'Если предложение устроило — оформляем заказ и доставку на обычных условиях.',
  },
]

export default function PriceMatchPage() {
  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-block', padding: '6px 14px', borderRadius: 20,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 16,
        }}>
          💰 Перебьём цену конкурента
        </div>
        <h1 style={{
          fontFamily: 'var(--fh)', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800,
          lineHeight: 1.25, marginBottom: 14,
        }}>
          Нашли дешевле у другого поставщика?<br />Предложим цену ниже минимум на 5%
        </h1>
        <p style={{ fontSize: 15.5, color: 'var(--muted)', maxWidth: 620, margin: '0 auto' }}>
          Пришлите нам название товара и цену конкурента — сверим и, если это тот же материал,
          предложим цену как минимум на 5% ниже.
        </p>
      </div>

      {/* Как это работает */}
      <h2 className="prod-section-title" style={{ marginBottom: 18 }}>Как это работает</h2>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, marginBottom: 48,
      }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '18px 16px',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>
              {i + 1}. {s.title}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>{s.text}</div>
          </div>
        ))}
      </div>

      {/* Условия + форма */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(280px, 380px)',
        gap: 28, alignItems: 'start',
      }}>
        <div>
          <h2 className="prod-section-title" style={{ marginBottom: 14 }}>Условия</h2>
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <ConditionRow
              icon="🧾"
              title="Тот же товар, тот же объём"
              text="Сравниваем один и тот же материал, того же производителя и в том же количестве — иначе сравнение некорректно."
            />
            <ConditionRow
              icon="💰"
              title="Минимум −5% от цены конкурента"
              text="Итоговая скидка зависит от объёма заказа и может быть больше 5%."
            />
            <ConditionRow
              icon="📄"
              title="Актуальная цена"
              text="Нужен действующий прайс или коммерческое предложение конкурента — не старше пары недель."
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
              q="А если у конкурента дешевле из-за акции?"
              a="Учтём и акционную цену — если товар и объём совпадают, сравниваем с той ценой, что действует сейчас."
            />
            <FaqItem
              q="Нужен обязательно скриншот?"
              a="Нет, но с ним мы сверяем цену быстрее и точнее. Можно просто указать цену и название товара в форме."
            />
            <FaqItem
              q="Это распространяется на любые товары каталога?"
              a="На большинство позиций — да. По отдельным акционным и уценённым товарам условия обсуждаются индивидуально."
            />
            <FaqItem
              q="Сколько ждать ответ?"
              a="Обычно перезваниваем в течение рабочего дня — часы работы менеджеров указаны в футере сайта."
            />
          </div>
        </div>

        <div style={{ position: 'sticky', top: 90 }}>
          <PriceMatchForm />
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
