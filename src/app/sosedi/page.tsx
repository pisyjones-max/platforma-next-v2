import type { Metadata } from 'next'
import { CARD_WELCOME_BONUS } from '@/lib/constants'
import { SosediFunnel } from '@/components/sosedi/SosediFunnel'

export const metadata: Metadata = {
  title: `${CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов на стройку — Клуб соседей PLATFORMA`,
  description:
    `Бесплатная карта клуба соседей PLATFORMA: ${CARD_WELCOME_BONUS.toLocaleString('ru-RU')} баллов сразу, кэшбэк растёт с каждой покупкой. Только для тех, кто строится в Раменском округе.`,
  robots: { index: false, follow: false }, // рекламный лендинг, не для органической выдачи — не дублировать /loyalty-card в индексе
}

export default function SosediPage() {
  return <SosediFunnel />
}
