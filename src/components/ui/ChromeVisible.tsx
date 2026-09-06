'use client'
import { usePathname } from 'next/navigation'

// Страницы-лендинги под рекламу: без меню сайта, без футера, без попапов —
// человек с рекламы должен видеть только оффер и форму, без путей уйти со страницы.
const BARE_PATHS = ['/sosedi']

export function isBarePath(pathname: string): boolean {
  return BARE_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export function ChromeVisible({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (isBarePath(pathname)) return null
  return <>{children}</>
}
