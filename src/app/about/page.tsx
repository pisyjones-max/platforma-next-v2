import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'О компании — PLATFORMA',
  description: 'PLATFORMA — поставщик кровельных и строительных материалов в Московской области. Более 5 лет на рынке.',
}

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 80px' }}>
      <h1 style={{ fontFamily: 'var(--fh)', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
        О компании
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 48, fontSize: 15 }}>
        PLATFORMA — надёжный поставщик кровельных материалов в Подмосковье
      </p>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #192C1E 0%, #253d2b 100%)',
        borderRadius: 20, padding: '40px 36px', color: '#fff', marginBottom: 40,
      }}>
        <div style={{ fontFamily: 'var(--fh)', fontSize: 24, fontWeight: 800, marginBottom: 16 }}>
          PLAT<em style={{ color: 'var(--accent)' }}>FORMA</em>
        </div>
        <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.7, maxWidth: 560 }}>
          Мы специализируемся на оптовой и розничной поставке кровельных и фасадных материалов
          для частного строительства и коммерческих объектов Московской области.
          Работаем напрямую с производителями — без посредников и переплат.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 48 }}>
        {[
          { val: '5+', lbl: 'лет на рынке' },
          { val: '1 200+', lbl: 'позиций в каталоге' },
          { val: '3 000+', lbl: 'довольных клиентов' },
          { val: '1 день', lbl: 'срок обработки заказа' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '24px 20px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--fh)', fontSize: 28, fontWeight: 800, color: 'var(--accent)', marginBottom: 6 }}>{s.val}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Why us */}
      <h2 style={{ fontFamily: 'var(--fh)', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Почему выбирают нас</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 48 }}>
        {[
          { icon: '🏭', title: 'Прямые поставки', text: 'Работаем напрямую с заводами-изготовителями. Никаких посредников — цены ниже рыночных.' },
          { icon: '✅', title: 'Гарантия качества', text: 'Вся продукция сертифицирована. Работаем только с проверенными производителями.' },
          { icon: '📦', title: 'Большой склад', text: 'Собственный склад в Ногинске. Большинство позиций всегда в наличии — отгрузка день в день.' },
          { icon: '🚚', title: 'Быстрая доставка', text: 'Доставляем по всей Московской области. Самовывоз со скидкой 7%.' },
          { icon: '👷', title: 'Консультация', text: 'Помогаем подобрать материалы под ваш проект. Выезд замерщика бесплатно.' },
          { icon: '💳', title: 'Карта лояльности', text: 'Постоянным клиентам — кэшбэк 0.5%, скидки и приоритетное обслуживание.' },
        ].map((item, i) => (
          <div key={i} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '22px 20px',
          }}>
            <div style={{ fontSize: 30, marginBottom: 12 }}>{item.icon}</div>
            <div style={{ fontFamily: 'var(--fh)', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{item.text}</div>
          </div>
        ))}
      </div>

      {/* Contacts */}
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px' }}>
        <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Контакты</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { icon: '📞', label: 'Телефон', val: '+7 (933) 203-30-05', href: 'tel:+79332033005' },
            { icon: '💬', label: 'Telegram', val: '@platforma_roof', href: 'https://t.me/platforma_roof' },
            { icon: '📍', label: 'Склад', val: 'Ногинск, Московская область', href: null },
            { icon: '🕐', label: 'Режим работы', val: 'Пн–Пт 9:00–18:00, Сб 9:00–15:00', href: null },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{c.label}</div>
                {c.href ? (
                  <a href={c.href} style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>{c.val}</a>
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{c.val}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
