import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Старый домен, с которого переехали. Весь трафик и краулеры
// поисковиков должны получать 301-редирект на актуальный домен,
// чтобы избежать дублирования контента в индексе.
const OLD_HOST = 'platforma-pro.vercel.app'
const NEW_ORIGIN = 'https://platforma-msk.ru'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''

  if (host === OLD_HOST) {
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, NEW_ORIGIN)
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

// Применяем ко всем путям, кроме статики Next.js и служебных файлов
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
