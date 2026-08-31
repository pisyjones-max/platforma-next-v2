import { GERMETIKI_TYPES, GERMETIKI_FAQ } from '@/lib/germetikiHub'

export function GermetikiIntro() {
  return (
    <div style={{ marginTop: 8, marginBottom: 32 }}>
      <h2 style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>
        Какой герметик выбрать
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.7, maxWidth: 760, margin: '0 0 20px' }}>
        Универсального герметика на все случаи не существует — тип зависит от того, будет ли шов на улице
        или внутри, во влажной зоне или сухой, нужно ли красить шов после высыхания.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 32 }}>
        {GERMETIKI_TYPES.map(t => (
          <div
            key={t.title}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>{t.title}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.5 }}>{t.bestFor}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, opacity: 0.85 }}>{t.note}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {GERMETIKI_FAQ.map(item => (
          <details
            key={item.q}
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 18px' }}
          >
            <summary style={{ fontSize: 14.5, fontWeight: 600, cursor: 'pointer' }}>{item.q}</summary>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65, marginTop: 10 }}>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
