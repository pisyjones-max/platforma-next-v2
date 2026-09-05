import Link from 'next/link'
import type { CalcLanding } from '@/lib/calcLandingHub'
import { RoofCalculator } from '@/components/calculator/RoofCalculator'
import { SidingCalculator } from '@/components/calculator/SidingCalculator'
import { GutterCalculator } from '@/components/calculator/GutterCalculator'
import { InsulationCalculator } from '@/components/calculator/InsulationCalculator'

// CalcLandingPage — SEO-лендинг под кластер "калькулятор X" (отдельный от
// embedded-виджета на товаре/группе, см. Calculator.tsx). Рендерит тот же
// расчётный компонент без product — своя цель: захват верхнего трафика,
// перелинковка в каталог, а не апсейл на карточке товара.
export function CalcLandingPage({ data }: { data: CalcLanding }) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px 80px' }}>
      <nav className="breadcrumb">
        <span className="bc-item bc-link"><Link href="/">Каталог</Link></span>
        <span className="bc-sep">›</span>
        <span className="bc-item bc-cur">{data.title}</span>
      </nav>

      <div style={{ textAlign: 'center', margin: '28px 0 36px' }}>
        <h1 style={{
          fontFamily: 'var(--fh)', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800,
          lineHeight: 1.25, marginBottom: 14,
        }}>
          {data.heroTitle}
        </h1>
        <p style={{ fontSize: 15.5, color: 'var(--muted)', maxWidth: 620, margin: '0 auto' }}>
          {data.heroSubtitle}
        </p>
      </div>

      <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 32 }}>
        {data.intro}
      </p>

      <div className="calcw-body" style={{ marginBottom: 40 }}>
        {data.calcType === 'roofing' && <RoofCalculator />}
        {data.calcType === 'siding' && <SidingCalculator />}
        {data.calcType === 'gutter' && <GutterCalculator />}
        {data.calcType === 'insulation' && <InsulationCalculator />}
      </div>

      <div style={{
        background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12,
        padding: '14px 16px', fontSize: 13.5, marginBottom: 48, textAlign: 'center',
      }}>
        Готовы выбрать материал по расчёту? Смотрите{' '}
        <Link href={`/catalog/group/${data.groupSlug}`} style={{ color: 'var(--accent)', fontWeight: 700 }}>
          {data.groupTitle} в наличии
        </Link>
      </div>

      <h2 className="prod-section-title" style={{ marginBottom: 14 }}>Вопросы и ответы</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.faq.map((item, i) => (
          <details key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '14px 16px',
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14.5 }}>{item.q}</summary>
            <p style={{ marginTop: 8, fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
