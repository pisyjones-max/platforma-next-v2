import type { Metadata } from 'next'
import { BeforeAfterSlider } from '@/components/design/BeforeAfterSlider'
import { DesignRequestForm } from '@/components/design/DesignRequestForm'
import { DESIGN_PROJECT_PRICE, PHONE_NUMBER } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Бесплатный дизайн-проект дома — примерьте сайдинг, кровлю и фасад | PLATFORMA',
  description:
    'Пришлите фото своего дома — покажем, как он будет выглядеть с новым сайдингом, кровлей или фасадными панелями. Дизайн-проект бесплатно при оформлении карты лояльности.',
}

const EXAMPLES = [
  { caption: 'Сайдинг Docke Blockhouse, цвет «Дуб натуральный»' },
  { caption: 'Металлочерепица Grand Line, цвет RAL 8017' },
  { caption: 'Фасадные термопанели под клинкерный кирпич' },
]

const STEPS = [
  {
    icon: '📸',
    title: 'Присылаете фото дома',
    text: 'Через форму ниже или в Telegram — 1–3 фото фасада с разных ракурсов достаточно.',
  },
  {
    icon: '🎨',
    title: 'Выбираете материал',
    text: 'Сайдинг, металлочерепица, фасадные панели — или спросите у нас, что подойдёт лучше.',
  },
  {
    icon: '🖼️',
    title: 'Получаете визуализацию',
    text: 'Дизайнер подготовит рендер вашего дома с новым материалом — обычно в течение 1–2 дней.',
  },
  {
    icon: '🛒',
    title: 'Заказываете материал',
    text: 'Если проект понравился — оформляете карту лояльности, и стоимость проекта уходит бонусом на покупку.',
  },
]

export default function DesignProjectPage() {
  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-block', padding: '6px 14px', borderRadius: 20,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 16,
        }}>
          🎁 Дизайн-проект дома и участка
        </div>
        <h1 style={{
          fontFamily: 'var(--fh)', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800,
          lineHeight: 1.25, marginBottom: 14,
        }}>
          Примерьте новый сайдинг, кровлю<br />или фасад — на фото вашего дома
        </h1>
        <p style={{ fontSize: 15.5, color: 'var(--muted)', maxWidth: 620, margin: '0 auto' }}>
          Пришлите фото дома и расскажите, какими материалами хотите его отделать —
          мы подготовим дизайн-проект абсолютно бесплатно.
        </p>
      </div>

      {/* Before / After примеры */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 18, marginBottom: 48,
      }}>
        {EXAMPLES.map((ex, i) => (
          <BeforeAfterSlider key={i} caption={ex.caption} />
        ))}
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
          <h2 className="prod-section-title" style={{ marginBottom: 14 }}>Условия акции</h2>
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <ConditionRow
              icon="💰"
              title={`Стоимость услуги — ${DESIGN_PROJECT_PRICE} ₽`}
              text="Это реальная цена дизайн-проекта. Вы не платите её из своего кармана."
            />
            <ConditionRow
              icon="💳"
              title="Бесплатно при карте лояльности PLATFORMA"
              text={`Оформляете карту — и ${DESIGN_PROJECT_PRICE} ₽ зачисляются на неё бонусом. Списывается при покупке материалов по проекту.`}
            />
            <ConditionRow
              icon="🕐"
              title="Без спешки"
              text="Решать, покупать материалы или нет, можно уже после того, как увидите готовый проект."
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
              q="Это правда бесплатно?"
              a={`Да. Стоимость дизайн-проекта — ${DESIGN_PROJECT_PRICE} ₽. При оформлении карты лояльности эта сумма зачисляется на карту бонусом и идёт в счёт покупки материалов — то есть из своих денег вы за проект не платите.`}
            />
            <FaqItem
              q="Обязательно ли покупать материалы после проекта?"
              a="Нет, обязательств нет. Но если решите заказывать у нас — бонус на карте уже будет ждать."
            />
            <FaqItem
              q="Сколько фото нужно прислать?"
              a="Достаточно 1–3 фото фасада дома с разных сторон, желательно при дневном свете."
            />
            <FaqItem
              q="Сколько ждать результат?"
              a="Обычно готовим визуализацию за 1–2 рабочих дня, для сложных проектов — до 4 дней."
            />
          </div>
        </div>

        <div style={{ position: 'sticky', top: 90 }}>
          <DesignRequestForm />
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
