'use client'
import { useUI } from '@/context/UIContext'

export function CityConsultButton({ city }: { city: string }) {
  const { openConsult } = useUI()
  return (
    <button
      onClick={openConsult}
      style={{
        background: 'var(--accent)',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        padding: '14px 28px',
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'var(--fh)',
      }}
    >
      Заказать доставку в {city}
    </button>
  )
}
