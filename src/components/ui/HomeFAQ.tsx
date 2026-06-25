'use client'
import { useState } from 'react'

const FAQS = [
  {
    q: 'Чем отличается гибкая черепица от металлочерепицы?',
    a: 'Гибкая черепица тише при дожде, лучше гнётся на сложных формах кровли и не требует обрешётки с большим шагом. Металлочерепица дешевле при большой площади, проще в монтаже и служит 50+ лет без окраски. Для домов с нестандартной крышей (башенки, многоскатная) — гибкая черепица. Для простых двускатных — металлочерепица или профлист выгоднее.',
  },
  {
    q: 'Сколько рулонов подкладочного ковра нужно на 100 м² кровли?',
    a: 'На 100 м² кровли с нахлёстом 10–15 см нужно примерно 110–115 м² подкладочного ковра. Стандартный рулон — 15 м², значит 8 рулонов с небольшим запасом. Для ендов и карнизных свесов добавьте ещё 10% площади этих зон.',
  },
  {
    q: 'Какой утеплитель лучше для кровли — минвата или PIR-плита?',
    a: 'Минеральная вата (Rockwool, Isover) — стандарт для скатных кровель: дышит, негорючая, дешевле. PIR-плита в 2–3 раза тоньше при той же теплоизоляции, идеальна для плоских кровель и мест, где критична толщина пирога. По цене PIR дороже в 2–3 раза, но экономит пространство и пароизоляцию.',
  },
  {
    q: 'Доставляете ли вы в Раменское, Жуковский, Бронницы?',
    a: 'Да, доставляем по всей Московской области включая Раменское, Жуковский, Бронницы, Коломну, Воскресенск и другие города. Срок доставки — 1–2 рабочих дня. Самовывоз из Ногинска — со скидкой 7%. Уточните стоимость доставки по телефону +7 (933) 203-30-05.',
  },
  {
    q: 'Какой профлист выбрать для забора — С8 или С20?',
    a: 'С8 — тоньше и дешевле, достаточно для декоративного забора при пролёте до 2 м. С20 — жёстче за счёт глубокой трапеции, выдерживает ветровые нагрузки лучше, рекомендуется при пролёте 2–3 м или в ветреных районах. Для кровли берите Н44 или Н60 — они несущие.',
  },
  {
    q: 'Как правильно рассчитать количество саморезов на кровлю?',
    a: 'Стандартный расход: 6–8 саморезов на 1 м² для металлочерепицы, 5–6 на 1 м² для профлиста. На 100 м² кровли — 600–800 штук. Берите с запасом 10%: саморезы теряются и часть уходит в брак. В упаковке обычно 250 штук — 3 упаковки на 100 м² кровли.',
  },
  {
    q: 'Можно ли оплатить заказ картой или только наличными?',
    a: 'Принимаем оплату картой (онлайн на сайте), наличными и безналичным переводом для юридических лиц. Работаем с НДС, выставляем счета. Для крупных заказов возможна рассрочка — уточняйте у менеджера.',
  },
  {
    q: 'Нужна ли гидроизоляция под металлочерепицу?',
    a: 'Да, обязательно. Под металлочерепицу укладывают супердиффузионную мембрану (1500 г/м²·сут и выше): она выводит конденсат из подкровельного пространства и защищает стропила. Без неё через 5–7 лет стропила начинают гнить. Мембрана монтируется поверх стропил перед обрешёткой.',
  },
]

export function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div style={{ marginTop: 48 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--fh)', fontSize: 22, fontWeight: 800 }}>
          Частые вопросы
        </h2>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>
          Отвечаем на главные вопросы о кровельных материалах
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FAQS.map((faq, i) => {
          const isOpen = open === i
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
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12,
                  padding: '16px 20px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{
                  fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, flex: 1,
                }}>
                  {faq.q}
                </span>
                <span style={{
                  fontSize: 18, color: isOpen ? '#7ecc9a' : 'var(--muted)',
                  transition: 'transform .25s, color .2s',
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  flexShrink: 0, lineHeight: 1,
                }}>+</span>
              </button>

              <div style={{
                maxHeight: isOpen ? 400 : 0,
                overflow: 'hidden',
                transition: 'max-height .3s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <div style={{
                  padding: '0 20px 18px',
                  fontSize: 13.5,
                  lineHeight: 1.75,
                  color: 'var(--muted)',
                  borderTop: '1px solid var(--border)',
                  paddingTop: 14,
                  marginTop: 0,
                }}>
                  {faq.a}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        marginTop: 20,
        padding: '16px 20px',
        background: 'rgba(126,204,154,.08)',
        border: '1px solid rgba(126,204,154,.25)',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 28 }}>👷</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>Не нашли ответ?</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Наш специалист ответит на любой вопрос по материалам и монтажу — бесплатно.
          </div>
        </div>
        <a
          href="tel:+79332033005"
          style={{
            padding: '11px 20px',
            background: 'linear-gradient(135deg, #7ecc9a, #4caf70)',
            borderRadius: 10,
            color: '#0d1f14',
            fontWeight: 800,
            fontSize: 13.5,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          📞 Позвонить
        </a>
      </div>
    </div>
  )
}
