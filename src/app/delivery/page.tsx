import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Доставка и оплата — PLATFORMA',
  description: 'Доставка кровельных материалов по Москве и Московской области. Самовывоз со склада в Ногинске.',
}

export default function DeliveryPage() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 80px' }}>
      <h1 style={{ fontFamily: 'var(--fh)', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
        Доставка и оплата
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 40, fontSize: 15 }}>
        Работаем по всей Московской области
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 48 }}>
        {[
          {
            icon: '🚚',
            title: 'Доставка по МО',
            lines: [
              'От 1 до 3 рабочих дней',
              'Стоимость от 1 500 ₽',
              'Уточняется при заказе',
            ],
          },
          {
            icon: '🏭',
            title: 'Самовывоз',
            lines: [
              'Склад: Ногинск, Московская обл.',
              'Пн–Пт 9:00–18:00, Сб 9:00–15:00',
            ],
          },
          {
            icon: '💳',
            title: 'Оплата',
            lines: [
              'Наличные при получении',
              'Перевод на карту',
              'Безналичный расчёт (НДС)',
            ],
          },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 16, padding: '28px 24px',
          }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>{card.icon}</div>
            <div style={{ fontFamily: 'var(--fh)', fontWeight: 700, fontSize: 17, marginBottom: 12 }}>{card.title}</div>
            {card.lines.map((l, j) => (
              <div key={j} style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 6 }}>— {l}</div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px', marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Зоны доставки</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
          {['Ногинск', 'Электросталь', 'Балашиха', 'Железнодорожный', 'Реутов', 'Люберцы', 'Раменское', 'Жуковский', 'Домодедово', 'Бронницы', 'Коломна', 'Воскресенск', 'Орехово-Зуево', 'Щёлково', 'Лосино-Петровский'].map((city, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--muted)', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              📍 {city}
            </div>
          ))}
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
          Доставка в другие населённые пункты — уточняйте по телефону{' '}
          <a href="tel:+79332033005" style={{ color: 'var(--accent)', fontWeight: 600 }}>+7 (933) 203-30-05</a>
        </p>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #192C1E, #253d2b)', borderRadius: 16, padding: '28px 32px', color: '#fff' }}>
        <div style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          🚛 Самовывоз со склада
        </div>
        <div style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.6 }}>
          Заберите заказ самостоятельно со склада в Ногинске.
          Оформите заказ онлайн или по телефону — мы подготовим товар к вашему приезду.
        </div>
      </div>
    </div>
  )
}
