import Link from 'next/link'
import { PRICE_NOTICE_SHORT } from '@/lib/constants'

/** Компактная оговорка «цены не являются офертой» со ссылкой на подробности. */
export function PriceNotice({ style, light }: { style?: React.CSSProperties; light?: boolean }) {
  return (
    <p style={{
      fontSize: 12, lineHeight: 1.5, margin: '10px 0 0',
      color: light ? 'rgba(255,255,255,.55)' : 'var(--muted)', ...style,
    }}>
      ℹ️ {PRICE_NOTICE_SHORT}{' '}
      <Link href="/ceny-i-nalichie" style={{ color: 'inherit', textDecoration: 'underline' }}>Подробнее</Link>
    </p>
  )
}
